import { Hono } from "hono"
import { db } from "@/db"
import {
  user, golfScore, charity, draw, drawResult, prizePool,
  winnerVerification, donation, jackpotRollover,
} from "@/db/schema"
import { eq, desc, ilike, or, sql, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import {
  generateRandomDraw, generateAlgorithmicDraw,
  calculateMatches, calculatePrizePool,
} from "@/lib/draw-engine"

export const adminRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

// Admin middleware
adminRoutes.use("/admin/*", async (c, next) => {
  const u = c.get("user") as Record<string, unknown> | null
  if (!u || u.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403)
  }
  await next()
})

// ── Users ──
adminRoutes.get("/admin/users", async (c) => {
  const search = c.req.query("search") || ""
  let users
  if (search) {
    users = await db.select().from(user).where(
      or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    ).orderBy(desc(user.createdAt))
  } else {
    users = await db.select().from(user).orderBy(desc(user.createdAt))
  }

  const withScores = await Promise.all(
    users.map(async (u) => {
      const scores = await db.select({ id: golfScore.id, score: golfScore.score, playedDate: golfScore.playedDate })
        .from(golfScore).where(eq(golfScore.userId, u.id)).orderBy(desc(golfScore.playedDate)).limit(5)
      return { ...u, scores }
    })
  )
  return c.json(withScores)
})

adminRoutes.put("/admin/users/:id", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json()
  const { name, role, subscriptionStatus } = body
  await db.update(user).set({
    ...(name && { name }),
    ...(role && { role }),
    ...(subscriptionStatus && { subscriptionStatus }),
  }).where(eq(user.id, id))
  return c.json({ success: true })
})

// ── Charities ──
adminRoutes.get("/admin/charities", async (c) => {
  const charities = await db.select().from(charity).orderBy(desc(charity.createdAt))
  return c.json(charities)
})

adminRoutes.post("/admin/charities", async (c) => {
  const body = await c.req.json()
  const [ch] = await db.insert(charity).values({
    name: body.name,
    description: body.description,
    website: body.website || null,
    featured: body.featured || false,
  }).returning()
  return c.json(ch, 201)
})

adminRoutes.put("/admin/charities/:id", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json()
  const [ch] = await db.update(charity).set({
    name: body.name,
    description: body.description,
    website: body.website || null,
    featured: body.featured ?? false,
  }).where(eq(charity.id, id)).returning()
  return c.json(ch)
})

adminRoutes.delete("/admin/charities/:id", async (c) => {
  const id = c.req.param("id")
  await db.delete(charity).where(eq(charity.id, id))
  return c.json({ success: true })
})

// ── Draws ──
adminRoutes.get("/admin/draws", async (c) => {
  const draws = await db.select().from(draw).orderBy(desc(draw.year), desc(draw.month))
  return c.json(draws)
})

adminRoutes.post("/admin/draws", async (c) => {
  const { month, year, logic } = await c.req.json()
  // Check duplicate
  const existing = await db.select().from(draw)
    .where(and(eq(draw.month, month), eq(draw.year, year)))
  if (existing.length > 0) {
    return c.json({ error: "A draw already exists for this month" }, 400)
  }
  const [d] = await db.insert(draw).values({ month, year, logic }).returning()
  return c.json(d, 201)
})

// Simulate draw
adminRoutes.post("/admin/draws/:id/simulate", async (c) => {
  const id = c.req.param("id")
  const [d] = await db.select().from(draw).where(eq(draw.id, id))
  if (!d) return c.json({ error: "Draw not found" }, 404)

  // Generate numbers
  const numbers = d.logic === "algorithmic"
    ? await generateAlgorithmicDraw()
    : generateRandomDraw()

  // Get all active subscribers with 5 scores
  const subscribers = await db.select().from(user)
    .where(eq(user.subscriptionStatus, "active"))

  // Delete old simulation results
  await db.delete(drawResult).where(eq(drawResult.drawId, id))
  await db.delete(prizePool).where(eq(prizePool.drawId, id))

  // Get accumulated rollover
  const rollovers = await db.select({ amount: jackpotRollover.amount })
    .from(jackpotRollover).where(eq(jackpotRollover.claimed, false))
  const rolloverTotal = rollovers.reduce((s, r) => s + parseFloat(r.amount), 0)

  // Calculate pool
  const pool = await calculatePrizePool(rolloverTotal)

  // Process each subscriber
  const winners: Record<number, string[]> = { 5: [], 4: [], 3: [] }
  for (const sub of subscribers) {
    const scores = await db.select({ score: golfScore.score })
      .from(golfScore).where(eq(golfScore.userId, sub.id))
      .orderBy(desc(golfScore.playedDate)).limit(5)
    if (scores.length < 5) continue

    const userScores = scores.map((s) => s.score)
    const { matchCount, matchedNumbers } = calculateMatches(userScores, numbers)

    if (matchCount >= 3) {
      winners[matchCount] = winners[matchCount] || []
      winners[matchCount].push(sub.id)
    }

    await db.insert(drawResult).values({
      drawId: id,
      userId: sub.id,
      matchedNumbers,
      matchCount,
      prizeAmount: "0", // Will be calculated after
    })
  }

  // Calculate prizes per tier
  for (const tier of [5, 4, 3] as const) {
    const tierPool = pool.tiers[tier]
    const winnerCount = winners[tier]?.length || 0
    const prizePerWinner = winnerCount > 0 ? tierPool.totalAmount / winnerCount : 0

    await db.insert(prizePool).values({
      drawId: id,
      tier,
      baseAmount: tierPool.baseAmount.toFixed(2),
      rolloverAmount: tierPool.rolloverAmount.toFixed(2),
      totalAmount: tierPool.totalAmount.toFixed(2),
    })

    // Update winner prizes
    if (winnerCount > 0 && prizePerWinner > 0) {
      for (const userId of winners[tier]) {
        await db.update(drawResult)
          .set({ prizeAmount: prizePerWinner.toFixed(2) })
          .where(and(eq(drawResult.drawId, id), eq(drawResult.userId, userId)))
      }
    }
  }

  // Update draw
  await db.update(draw).set({
    drawnNumbers: numbers,
    status: "simulated",
  }).where(eq(draw.id, id))

  return c.json({ numbers, pool, winners })
})

// Publish draw
adminRoutes.post("/admin/draws/:id/publish", async (c) => {
  const id = c.req.param("id")
  const [d] = await db.select().from(draw).where(eq(draw.id, id))
  if (!d) return c.json({ error: "Draw not found" }, 404)
  if (d.status !== "simulated") {
    return c.json({ error: "Draw must be simulated before publishing" }, 400)
  }

  // Check if there's a 5-match winner
  const fiveMatchWinners = await db.select().from(drawResult)
    .where(and(eq(drawResult.drawId, id), eq(drawResult.matchCount, 5)))
  
  if (fiveMatchWinners.length === 0) {
    // No jackpot winner — rollover
    const [poolTier5] = await db.select().from(prizePool)
      .where(and(eq(prizePool.drawId, id), eq(prizePool.tier, 5)))
    if (poolTier5) {
      await db.insert(jackpotRollover).values({
        fromDrawId: id,
        amount: poolTier5.baseAmount,
      })
    }
  } else {
    // Mark old rollovers as claimed
    await db.update(jackpotRollover).set({ claimed: true }).where(eq(jackpotRollover.claimed, false))
  }

  await db.update(draw).set({
    status: "published",
    publishedAt: new Date(),
  }).where(eq(draw.id, id))

  return c.json({ success: true })
})

// ── Winners ──
adminRoutes.get("/admin/winners", async (c) => {
  const results = await db.select().from(drawResult)
    .where(sql`${drawResult.matchCount} >= 3`)
    .orderBy(desc(drawResult.createdAt))

  const enriched = await Promise.all(results.map(async (r) => {
    const [u] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, r.userId))
    const [d] = await db.select({ month: draw.month, year: draw.year }).from(draw).where(eq(draw.id, r.drawId))
    const [v] = await db.select().from(winnerVerification).where(eq(winnerVerification.drawResultId, r.id))
    return {
      id: r.id, userName: u?.name, userEmail: u?.email,
      drawMonth: d?.month, drawYear: d?.year,
      matchCount: r.matchCount, prizeAmount: r.prizeAmount,
      paymentStatus: r.paymentStatus,
      verification: v || null,
    }
  }))

  return c.json(enriched)
})

adminRoutes.put("/admin/winners/:id/verify", async (c) => {
  const id = c.req.param("id")
  const { status, adminNotes } = await c.req.json()
  const [v] = await db.select().from(winnerVerification).where(eq(winnerVerification.drawResultId, id))
  if (!v) return c.json({ error: "No verification found" }, 404)
  await db.update(winnerVerification).set({
    status, adminNotes, reviewedAt: new Date(),
  }).where(eq(winnerVerification.id, v.id))
  return c.json({ success: true })
})

adminRoutes.put("/admin/winners/:id/payout", async (c) => {
  const id = c.req.param("id")
  await db.update(drawResult).set({ paymentStatus: "paid" }).where(eq(drawResult.id, id))
  return c.json({ success: true })
})

// ── Reports ──
adminRoutes.get("/admin/reports", async (c) => {
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(user)
  const [subCount] = await db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.subscriptionStatus, "active"))
  const [donationTotal] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(donation)
  const [drawCount] = await db.select({ count: sql<number>`count(*)::int` }).from(draw)
  const [pendingV] = await db.select({ count: sql<number>`count(*)::int` }).from(winnerVerification).where(eq(winnerVerification.status, "pending"))

  const pool = await calculatePrizePool()

  const drawStats = await db.select({
    month: draw.month, year: draw.year,
  }).from(draw).where(eq(draw.status, "published")).orderBy(desc(draw.year), desc(draw.month))

  const stats = await Promise.all(drawStats.map(async (d) => {
    const [p] = await db.select({ count: sql<number>`count(*)::int` }).from(drawResult)
      .innerJoin(draw, eq(drawResult.drawId, draw.id))
      .where(and(eq(draw.month, d.month), eq(draw.year, d.year)))
    const [w] = await db.select({ count: sql<number>`count(*)::int` }).from(drawResult)
      .innerJoin(draw, eq(drawResult.drawId, draw.id))
      .where(and(eq(draw.month, d.month), eq(draw.year, d.year), sql`${drawResult.matchCount} >= 3`))
    return { month: d.month, year: d.year, participants: p?.count || 0, winners: w?.count || 0 }
  }))

  return c.json({
    totalUsers: userCount?.count || 0,
    activeSubscribers: subCount?.count || 0,
    totalPrizePool: pool.totalPool.toFixed(2),
    totalCharityContributions: donationTotal?.total || "0.00",
    totalDraws: drawCount?.count || 0,
    pendingVerifications: pendingV?.count || 0,
    drawStats: stats,
  })
})
