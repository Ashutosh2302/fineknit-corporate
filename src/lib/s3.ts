import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const AWS_ACCESS_KEY_ID = requiredEnv("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = requiredEnv("AWS_SECRET_ACCESS_KEY");
const AWS_S3_BUCKET_SKUS =
  process.env.AWS_S3_BUCKET_SKUS ?? process.env.AWS_S3_BUCKET ?? "fineknit-skus";
const AWS_S3_BUCKET_INVOICES = process.env.AWS_S3_BUCKET_INVOICES ?? "fineknit-invoices";

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadBufferToS3(params: {
  folder: "skus" | "invoices";
  fileName: string;
  contentType: string;
  body: Buffer;
}) {
  const safeName = sanitizeFileName(params.fileName || "upload.bin");
  const key = `${params.folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const bucket = params.folder === "invoices" ? AWS_S3_BUCKET_INVOICES : AWS_S3_BUCKET_SKUS;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType || "application/octet-stream",
    })
  );

  const publicUrl = `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  return { key, publicUrl };
}
