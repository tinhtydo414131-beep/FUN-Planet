// Supabase Edge Function: upload-to-r2
// Uploads a file to Cloudflare R2 using AWS SDK v3 and returns a public URL.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Use AWS SDK v3 (S3Client) via esm.sh so it works in the Deno edge runtime.
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.758.0?target=deno";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

function getR2Client() {
  const endpoint = getEnvOrThrow("R2_ENDPOINT");
  const accessKeyId = getEnvOrThrow("R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnvOrThrow("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const bucketName = getEnvOrThrow("R2_BUCKET_NAME");
    const publicBase = getEnvOrThrow("R2_PUBLIC_URL").replace(/\/$/, "");

    // Basic diagnostics (never log secrets)
    console.log("🧩 upload-to-r2 config", {
      bucketName,
      endpointPresent: Boolean(Deno.env.get("R2_ENDPOINT")),
      publicBase,
      hasAccessKey: Boolean(Deno.env.get("R2_ACCESS_KEY_ID")),
      hasSecretKey: Boolean(Deno.env.get("R2_SECRET_ACCESS_KEY")),
    });

    const contentType = req.headers.get("content-type") || "";

    // Expect multipart/form-data with fields: file (File), folder (string, optional)
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ success: false, error: "Expected multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder")?.toString() || "uploads").replace(/^\/+|\/+$/g, "");

    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const originalName = file.name || "upload";
    const safeName = sanitizeFilename(originalName);
    const key = `${folder}/${crypto.randomUUID()}-${safeName}`;

    const body = new Uint8Array(await file.arrayBuffer());
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
      }),
    );

    const url = `${publicBase}/${key}`;

    console.log("✅ Uploaded to R2", { key, size: file.size, type: file.type || null });

    return new Response(
      JSON.stringify({
        success: true,
        url,
        key,
        size: file.size,
        type: file.type,
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
