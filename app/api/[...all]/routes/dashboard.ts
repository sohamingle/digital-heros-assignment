import { Hono } from "hono"
import { db } from "@/db"
import { golfScore, user, draw, drawResult, charity, donation } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"

export const dashboardRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

// GET /api/dashboard — aggregated dashboard data
dashboardRoutes.get("/dashboard", async (c) => {
  const u = c.get("user")
  if (!u) return c.json({ error: "Unauthorized" }, 401)

  // User subscription info
  const [userData] = await db
    .select({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      charityId: user.charityId,
      charityPercentage: user.charityPercentage,
    })
    .from(user)
    .where(eq(user.id, u.id))

  // Scores
  const scores = await db
    .select({ id: golfScore.id, score: golfScore.score, playedDate: golfScore.playedDate })
    .from(golfScore)
    .where(eq(golfScore.userId, u.id))
    .orderBy(desc(golfScore.playedDate))
    .limit(5)

  // Charity
  let charityInfo = null
  if (userData?.charityId) {
    const [ch] = await db.select({ id: charity.id, name: charity.name }).from(charity).where(eq(charity.id, userData.charityId))
    if (ch) charityInfo = { ...ch, percentage: userData.charityPercentage || 10 }
  }

  // Draws participation
  const drawResults = await db
    .select({ id: drawResult.id, prizeAmount: drawResult.prizeAmount, paymentStatus: drawResult.paymentStatus })
    .from(drawResult)
    .where(eq(drawResult.userId, u.id))

  const totalWon = drawResults.reduce((sum, r) => sum + parseFloat(r.prizeAmount || "0"), 0)
  const pending = drawResults.filter((r) => parseFloat(r.prizeAmount || "0") > 0 && r.paymentStatus === "pending").length

  return c.json({
    subscription: {
      status: userData?.subscriptionStatus || "none",
      plan: userData?.subscriptionPlan || null,
      expiresAt: userData?.subscriptionExpiresAt || null,
    },
    scores,
    charity: charityInfo,
    draws: { entered: drawResults.length, upcoming: null },
    winnings: { total: totalWon.toFixed(2), pending },
  })
})
