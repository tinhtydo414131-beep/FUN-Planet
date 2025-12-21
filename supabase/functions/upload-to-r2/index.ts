// Supabase Edge Function: upload-to-r2
// Uploads a file to Cloudflare R2 using fetch API with AWS Signature V4

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://planet.fun.rich",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function getEnvOrThrow(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// Helper to convert Uint8Array to hex string
function toHex(data: Uint8Array): string {
  return new TextDecoder().decode(hexEncode(data));
}

// SHA256 hash - cast to ArrayBuffer to fix type issues
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return new Uint8Array(hash);
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  return toHex(await sha256(data));
}

// HMAC-SHA256 - cast to ArrayBuffer to fix type issues
async function hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function hmacHex(key: Uint8Array, data: string): Promise<string> {
  return toHex(await hmac(key, data));
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<Uint8Array> {
  const kDate = await hmac(new TextEncoder().encode("AWS4" + key), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  return kSigning;
}

// AWS Signature V4 signing for S3/R2
async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: Uint8Array | null,
  accessKeyId: string,
  secretAccessKey: string,
  region: string = "auto"
): Promise<Record<string, string>> {
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  // Create canonical headers
  const host = url.host;
  headers["host"] = host;
  headers["x-amz-date"] = amzDate;
  headers["x-amz-content-sha256"] = body ? await sha256Hex(body) : "UNSIGNED-PAYLOAD";

  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(";");

  const canonicalHeaders = Object.keys(headers)
    .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
    .sort()
    .join("\n") + "\n";

  const canonicalRequest = [
    method,
    url.pathname,
    url.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    headers["x-amz-content-sha256"],
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(new TextEncoder().encode(canonicalRequest)),
  ].join("\n");

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  headers["Authorization"] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bucketName = getEnvOrThrow("R2_BUCKET_NAME");
    const publicBase = getEnvOrThrow("R2_PUBLIC_URL").replace(/\/$/, "");
    const endpoint = getEnvOrThrow("R2_ENDPOINT").replace(/\/$/, "");
    const accessKeyId = getEnvOrThrow("R2_ACCESS_KEY_ID");
    const secretAccessKey = getEnvOrThrow("R2_SECRET_ACCESS_KEY");

    // Basic diagnostics (never log secrets)
    console.log("🧩 upload-to-r2 config", {
      bucketName,
      endpointPresent: Boolean(endpoint),
      publicBase,
      hasAccessKey: Boolean(accessKeyId),
      hasSecretKey: Boolean(secretAccessKey),
    });

    const contentType = req.headers.get("content-type") || "";

    let file: File | null = null;
    let folder = "uploads";

    // Support BOTH multipart/form-data (browser direct) and JSON base64 (fallback)
    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const form = await req.formData();
      const formFile = form.get("file");
      folder = (form.get("folder")?.toString() || "uploads").replace(/^\/+|\/+$/g, "");

      if (formFile instanceof File) file = formFile;
    } else if (contentType.toLowerCase().includes("application/json")) {
      const body = await req.json().catch(() => null) as null | {
        fileBase64?: string;
        fileName?: string;
        contentType?: string;
        folder?: string;
      };

      folder = (body?.folder || "uploads").replace(/^\/+|\/+$/g, "");
      const fileName = body?.fileName || "upload";
      const ct = body?.contentType || "application/octet-stream";

      if (body?.fileBase64) {
        const raw = body.fileBase64.includes(",")
          ? body.fileBase64.split(",")[1]
          : body.fileBase64;

        const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
        file = new File([bytes], fileName, { type: ct });
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Expected multipart/form-data or application/json" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const originalName = file.name || "upload";
    const safeName = sanitizeFilename(originalName);
    const key = `${folder}/${crypto.randomUUID()}-${safeName}`;

    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    const fileContentType = file.type || "application/octet-stream";

    // Build R2 upload URL
    const uploadUrl = new URL(`${endpoint}/${bucketName}/${key}`);

    // Sign the request
    const headers: Record<string, string> = {
      "Content-Type": fileContentType,
      "Content-Length": fileBuffer.length.toString(),
    };

    const signedHeaders = await signRequest(
      "PUT",
      uploadUrl,
      headers,
      fileBuffer,
      accessKeyId,
      secretAccessKey
    );

    console.log("📤 Uploading to R2:", { key, size: fileBuffer.length, type: fileContentType });

    // Upload to R2
    const uploadResponse = await fetch(uploadUrl.toString(), {
      method: "PUT",
      headers: signedHeaders,
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("❌ R2 upload failed:", uploadResponse.status, errorText);
      throw new Error(`R2 upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const url = `${publicBase}/${key}`;

    console.log("✅ Uploaded to R2", { key, size: file.size, type: fileContentType, url });

    return new Response(
      JSON.stringify({
        success: true,
        url,
        key,
        size: file.size,
        type: fileContentType,
        folder,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("❌ upload-to-r2 error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
