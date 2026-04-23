import { db } from "@/db"
import { golfScore, user } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

/**
 * Generate draw numbers using random selection (1–45)
 */
export function generateRandomDraw(): number[] {
  const numbers = new Set<number>()
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * Generate draw numbers using algorithmic weighting based on score frequency.
 * Scores that appear more frequently across all users get higher weight.
 */
export async function generateAlgorithmicDraw(): Promise<number[]> {
  // Get frequency of each score across all users
  const scoreFrequencies = await db
    .select({
      score: golfScore.score,
      count: sql<number>`count(*)::int`,
    })
    .from(golfScore)
    .groupBy(golfScore.score)

  if (scoreFrequencies.length < 5) {
    // Not enough data, fall back to random
    return generateRandomDraw()
  }

  // Build weighted pool: more frequent scores have higher weight
  const weightedPool: number[] = []
  for (const { score, count } of scoreFrequencies) {
    // Add each score to the pool `count` times for weighted selection
    for (let i = 0; i < count; i++) {
      weightedPool.push(score)
    }
  }

  const selected = new Set<number>()
  let attempts = 0
  while (selected.size < 5 && attempts < 1000) {
    const idx = Math.floor(Math.random() * weightedPool.length)
    selected.add(weightedPool[idx])
    attempts++
  }

  // If we still don't have 5, fill with random
  while (selected.size < 5) {
    selected.add(Math.floor(Math.random() * 45) + 1)
  }

  return Array.from(selected).sort((a, b) => a - b)
}

/**
 * Calculate matches between a user's scores and drawn numbers
 */
export function calculateMatches(
  userScores: number[],
  drawnNumbers: number[]
): { matchCount: number; matchedNumbers: number[] } {
  const drawnSet = new Set(drawnNumbers)
  const matched = userScores.filter((s) => drawnSet.has(s))
  return {
    matchCount: matched.length,
    matchedNumbers: matched.sort((a, b) => a - b),
  }
}

/**
 * Calculate prize pool distribution based on active subscriber count.
 * Each subscription contributes a fixed portion (₹2.50) to the prize pool.
 */
export async function calculatePrizePool(rolloverAmount = 0) {
  const activeCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(eq(user.subscriptionStatus, "active"))

  const subscriberCount = activeCount[0]?.count ?? 0
  const contributionPerUser = 2.5 // ₹2.50 per subscriber per month
  const totalPool = subscriberCount * contributionPerUser

  return {
    subscriberCount,
    totalPool,
    tiers: {
      5: {
        baseAmount: totalPool * 0.4,
        rolloverAmount,
        totalAmount: totalPool * 0.4 + rolloverAmount,
      },
      4: {
        baseAmount: totalPool * 0.35,
        rolloverAmount: 0,
        totalAmount: totalPool * 0.35,
      },
      3: {
        baseAmount: totalPool * 0.25,
        rolloverAmount: 0,
        totalAmount: totalPool * 0.25,
      },
    },
  }
}
