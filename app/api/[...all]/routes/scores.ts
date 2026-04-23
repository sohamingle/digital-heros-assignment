import { Hono } from "hono"
import { db } from "@/db"
import { golfScore } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { auth } from "@/lib/auth"

export const scoresRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

  // GET /api/scores — get current user's latest 5 scores
  .get("/scores", async (c) => {
    const user = c.get("user")
    if (!user) return c.json({ error: "Unauthorized" }, 401)

    const scores = await db
      .select()
      .from(golfScore)
      .where(eq(golfScore.userId, user.id))
      .orderBy(desc(golfScore.playedDate))
      .limit(5)

    return c.json(scores)
  })

  // POST /api/scores — add a score
  .post("/scores", async (c) => {
    const user = c.get("user")
    if (!user) return c.json({ error: "Unauthorized" }, 401)

    const body = await c.req.json()
    const { score, playedDate } = body

    // Validate score range
    if (!score || score < 1 || score > 45) {
      return c.json({ error: "Score must be between 1 and 45" }, 400)
    }

    // Validate date
    if (!playedDate) {
      return c.json({ error: "Date is required" }, 400)
    }

    // Check for duplicate date
    const existing = await db
      .select()
      .from(golfScore)
      .where(
        and(eq(golfScore.userId, user.id), eq(golfScore.playedDate, playedDate))
      )

    if (existing.length > 0) {
      return c.json(
        {
          error:
            "You already have a score for this date. Edit or delete it instead.",
        },
        400
      )
    }

    // Check count — if already 5, delete oldest
    const allScores = await db
      .select()
      .from(golfScore)
      .where(eq(golfScore.userId, user.id))
      .orderBy(desc(golfScore.playedDate))

    if (allScores.length >= 5) {
      const oldest = allScores[allScores.length - 1]
      await db.delete(golfScore).where(eq(golfScore.id, oldest.id))
    }

    const [newScore] = await db
      .insert(golfScore)
      .values({
        userId: user.id,
        score,
        playedDate,
      })
      .returning()

    return c.json(newScore, 201)
  })

  // PUT /api/scores/:id — edit a score
  .put("/scores/:id", async (c) => {
    const user = c.get("user")
    if (!user) return c.json({ error: "Unauthorized" }, 401)

    const id = c.req.param("id")
    const body = await c.req.json()
    const { score, playedDate } = body

    if (score && (score < 1 || score > 45)) {
      return c.json({ error: "Score must be between 1 and 45" }, 400)
    }

    // Verify ownership
    const existing = await db
      .select()
      .from(golfScore)
      .where(and(eq(golfScore.id, id), eq(golfScore.userId, user.id)))

    if (existing.length === 0) {
      return c.json({ error: "Score not found" }, 404)
    }

    // Check duplicate date (if changing date)
    if (playedDate && playedDate !== existing[0].playedDate) {
      const dup = await db
        .select()
        .from(golfScore)
        .where(
          and(
            eq(golfScore.userId, user.id),
            eq(golfScore.playedDate, playedDate)
          )
        )
      if (dup.length > 0) {
        return c.json({ error: "A score already exists for that date" }, 400)
      }
    }

    const [updated] = await db
      .update(golfScore)
      .set({
        ...(score !== undefined && { score }),
        ...(playedDate !== undefined && { playedDate }),
      })
      .where(eq(golfScore.id, id))
      .returning()

    return c.json(updated)
  })

  // DELETE /api/scores/:id
  .delete("/scores/:id", async (c) => {
    const user = c.get("user")
    if (!user) return c.json({ error: "Unauthorized" }, 401)

    const id = c.req.param("id")
    const existing = await db
      .select()
      .from(golfScore)
      .where(and(eq(golfScore.id, id), eq(golfScore.userId, user.id)))

    if (existing.length === 0) {
      return c.json({ error: "Score not found" }, 404)
    }

    await db.delete(golfScore).where(eq(golfScore.id, id))
    return c.json({ success: true })
  })
