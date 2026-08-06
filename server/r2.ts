import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Cloudflare R2 is S3-compatible, so we use the AWS S3 SDK pointed at the R2
// endpoint. Audio files live here; Postgres only stores the resulting URL.
const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
// Public base URL for playback (r2.dev dev URL or a connected custom domain).
const publicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

export const r2Configured = Boolean(
  endpoint && accessKeyId && secretAccessKey && bucket && publicBase,
);

const client = r2Configured
  ? new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null;

const EXT_BY_TYPE: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

export function extForType(contentType: string): string {
  return EXT_BY_TYPE[contentType] || "bin";
}

// Uploads a buffer to R2 under audio/<uuid>.<ext> and returns its public URL.
export async function uploadAudio(
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!client || !r2Configured) {
    throw new Error("R2 is not configured (set R2_* env vars).");
  }
  const key = `audio/${randomUUID()}.${extForType(contentType)}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${publicBase}/${key}`;
}
