import { Hono } from "hono"
import { db } from "@/db"
import { draw, drawResult, golfScore, winnerVerification } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { auth } from "@/lib/auth"

export const drawsRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

// GET /api/draws — list published draws with user's results
drawsRoutes.get("/draws", async (c) => {
  const user = c.get("user")
  const draws = await db
    .select()
    .from(draw)
    .where(eq(draw.status, "published"))
    .orderBy(desc(draw.year), desc(draw.month))

  if (!user) return c.json(draws)

  // Attach user's results
  const withResults = await Promise.all(
    draws.map(async (d) => {
      const [result] = await db
        .select()
        .from(drawResult)
        .where(
          and(eq(drawResult.drawId, d.id), eq(drawResult.userId, user.id))
        )
      
      let hasVerification = false
      if (result) {
        const [v] = await db
          .select()
          .from(winnerVerification)
          .where(eq(winnerVerification.drawResultId, result.id))
        hasVerification = !!v
      }

      return { 
        ...d, 
        results: result ? {
          id: result.id,
          matchCount: result.matchCount,
          matchedNumbers: result.matchedNumbers,
          prizeAmount: result.prizeAmount,
          paymentStatus: result.paymentStatus,
          hasVerification
        } : null 
      }
    })
  )

  return c.json(withResults)
})

// GET /api/draws/current
drawsRoutes.get("/draws/current", async (c) => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const [current] = await db
    .select()
    .from(draw)
    .where(and(eq(draw.month, month), eq(draw.year, year)))
  return c.json(current || null)
})

// POST /api/draws/verify — submit proof for a win
drawsRoutes.post("/draws/verify", async (c) => {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)

  const { drawResultId, proofUrl } = await c.req.json()
  if (!drawResultId || !proofUrl) {
    return c.json({ error: "Draw result ID and proof URL are required" }, 400)
  }

  // 1. Verify the result belongs to the user
  const [result] = await db
    .select()
    .from(drawResult)
    .where(and(eq(drawResult.id, drawResultId), eq(drawResult.userId, user.id)))

  if (!result) {
    return c.json({ error: "Invalid draw result" }, 404)
  }

  // 2. Create verification request
  await db.insert(winnerVerification).values({
    drawResultId,
    proofUrl,
    status: "pending",
  })

  return c.json({ success: true })
})

