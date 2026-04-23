import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const s3Client = new S3Client({
  forcePathStyle: true,
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

export const R2_BUCKET = process.env.AWS_S3_BUCKET || "postbridge"

/**
 * Generate a pre-signed URL for client-side direct uploads to Cloudflare R2
 * @param filename - The target filename including extension
 * @param contentType - e.g. 'video/mp4' or 'image/jpeg'
 * @returns { url: string; key: string }
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string
) {
  // Add a unique timestamp to avoid collisions
  const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-]/g, "_")}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  // URL expires in 15 minutes
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 })

  return {
    url: signedUrl,
    key,
    // The final public or internal URL where the file can be fetched from
    // Assuming you have a custom domain hooked up to R2, you'd prepend it here.
    // E.g., `https://media.postbridge.com/${key}`
    // If not, we just use the raw endpoint for internal fetching.
    accessUrl: `${process.env.AWS_CLOUDFRONT_URL}/${key}`,
  }
}

/**
 * Deletes a file from R2
 */
export async function deleteFileFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  await s3Client.send(command)
  return true
}

export async function uploadBufferToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
) {
  const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-]/g, "_")}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await s3Client.send(command)

  return `${process.env.AWS_CLOUDFRONT_URL}/${key}`
}
