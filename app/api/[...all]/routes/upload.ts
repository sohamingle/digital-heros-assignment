import { Hono } from "hono"
import { getPresignedUploadUrl, uploadBufferToR2 } from "@/lib/storage"
import { auth } from "@/lib/auth"

export const uploadRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

uploadRoutes.post("/upload/presigned", async (c) => {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)

  const { filename, contentType } = await c.req.json()
  if (!filename || !contentType) {
    return c.json({ error: "Filename and content type are required" }, 400)
  }

  try {
    const data = await getPresignedUploadUrl(filename, contentType)
    return c.json(data)
  } catch (error) {
    console.error(error)
    return c.json({ error: "Failed to generate presigned URL" }, 500)
  }
})

uploadRoutes.post("/upload/direct", async (c) => {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)

  try {
    const body = await c.req.parseBody()
    const file = body["file"] as File

    if (!file) {
      return c.json({ error: "No file provided" }, 400)
    }

    // 1MB limit check on server too
    if (file.size > 1024 * 1024) {
      return c.json({ error: "File too large (max 1MB)" }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadBufferToR2(buffer, file.name, file.type)

    return c.json({ url })
  } catch (error) {
    console.error("Direct upload failed:", error)
    return c.json({ error: "Upload failed" }, 500)
  }
})

