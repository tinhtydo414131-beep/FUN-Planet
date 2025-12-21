import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "https://esm.sh/@aws-sdk/client-s3@3.758.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function getEnvOrThrow(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

// Initialize S3 client for Cloudflare R2
function getR2Client(): S3Client {
  const accessKeyId = getEnvOrThrow("R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnvOrThrow("R2_SECRET_ACCESS_KEY");
  const endpoint = getEnvOrThrow("R2_ENDPOINT");

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bucketName = getEnvOrThrow("R2_BUCKET_NAME");
    const endpoint = getEnvOrThrow("R2_ENDPOINT");
    const publicUrl = getEnvOrThrow("R2_PUBLIC_URL");

    // Helpful diagnostics (do not log secrets)
    console.log("🧩 R2 config", {
      bucketName,
      endpointPresent: Boolean(endpoint),
      publicUrl: publicUrl.replace(/\/$/, ""),
      hasAccessKey: Boolean(Deno.env.get("R2_ACCESS_KEY_ID")),
      hasSecretKey: Boolean(Deno.env.get("R2_SECRET_ACCESS_KEY")),
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = ((formData.get("folder") as string) || "uploads").replace(/^\/+|\/+$/g, "");
    const action = (formData.get("action") as string) || "upload";
    const deleteKey = (formData.get("key") as string) || "";
    
    // Handle delete action
    if (action === 'delete' && deleteKey) {
      console.log(`🗑️ Deleting file: ${deleteKey}`);
      
      const client = getR2Client();
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: deleteKey,
      });
      
      await client.send(command);
      
      console.log(`✅ Delete successful: ${deleteKey}`);
      return new Response(
        JSON.stringify({ success: true, deleted: deleteKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes) to folder: ${folder}`);

    // Validate file size (max 500MB for videos, 50MB for others)
    const maxSize = folder === 'videos' ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique key: uuid + original filename (sanitized for safety)
    const originalName = file.name || "upload";
    const safeName = sanitizeFilename(originalName);
    const key = `${folder}/${crypto.randomUUID()}-${safeName}`;

    console.log(`🧾 Generated key: ${key}`);

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // Determine content type
    const contentType = file.type || getContentType(originalName);
    
    // Initialize S3 client
    const client = getR2Client();
    
    // Upload using AWS SDK v3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: new Uint8Array(fileBuffer),
      ContentType: contentType,
      // Add cache control for better CDN performance
      CacheControl: getCacheControl(folder),
    });

    await client.send(command);

    // Construct public URL
    const fileUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;
    
    console.log(`✅ Upload successful: ${fileUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: fileUrl,
        key: key,
        size: file.size,
        type: contentType,
        folder: folder
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ R2 upload error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to determine content type from filename
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    // Audio
    'mp3': 'audio/mpeg',
    'm4a': 'audio/mp4',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    // Archives
    'zip': 'application/zip',
    '7z': 'application/x-7z-compressed',
    'rar': 'application/vnd.rar',
    // Documents
    'pdf': 'application/pdf',
    'json': 'application/json',
  };
  return types[ext || ''] || 'application/octet-stream';
}

// Cache control based on content type
function getCacheControl(folder: string): string {
  switch (folder) {
    case 'avatars':
    case 'covers':
      return 'public, max-age=86400, s-maxage=604800'; // 1 day browser, 7 days CDN
    case 'games':
      return 'public, max-age=3600, s-maxage=86400'; // 1 hour browser, 1 day CDN
    case 'music':
    case 'videos':
      return 'public, max-age=604800, s-maxage=2592000'; // 7 days browser, 30 days CDN
    default:
      return 'public, max-age=3600'; // 1 hour default
  }
}
