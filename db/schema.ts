import { relations } from "drizzle-orm"
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  uniqueIndex,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core"

// ── Enums ──

export const userRoleEnum = pgEnum("user_role", ["user", "admin"])

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "none",
  "active",
  "cancelled",
  "lapsed",
])

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "monthly",
  "yearly",
])

export const drawStatusEnum = pgEnum("draw_status", [
  "draft",
  "simulated",
  "published",
])

export const drawLogicEnum = pgEnum("draw_logic", ["random", "algorithmic"])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
])

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
])

// ── Auth Tables (Better Auth) ──

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // ── Domain Fields ──
  role: userRoleEnum("role").default("user").notNull(),
  charityId: text("charity_id"),
  charityPercentage: integer("charity_percentage").default(10),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .default("none")
    .notNull(),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

// ── Domain Tables ──

export const charity = pgTable("charity", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  website: text("website"),
  featured: boolean("featured").default(false).notNull(),
  events: jsonb("events").$type<
    { title: string; date: string; description: string }[]
  >(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const golfScore = pgTable(
  "golf_score",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 1–45 Stableford
    playedDate: date("played_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("golf_score_userId_idx").on(table.userId),
    uniqueIndex("golf_score_user_date_idx").on(table.userId, table.playedDate),
  ]
)

export const draw = pgTable("draw", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  logic: drawLogicEnum("logic").default("random").notNull(),
  status: drawStatusEnum("status").default("draft").notNull(),
  drawnNumbers: jsonb("drawn_numbers").$type<number[]>(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const drawResult = pgTable(
  "draw_result",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    drawId: text("draw_id")
      .notNull()
      .references(() => draw.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    matchedNumbers: jsonb("matched_numbers").$type<number[]>(),
    matchCount: integer("match_count").notNull().default(0),
    prizeAmount: numeric("prize_amount", { precision: 12, scale: 2 }).default(
      "0"
    ),
    paymentStatus: paymentStatusEnum("payment_status")
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("draw_result_drawId_idx").on(table.drawId),
    index("draw_result_userId_idx").on(table.userId),
  ]
)

export const prizePool = pgTable("prize_pool", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  drawId: text("draw_id")
    .notNull()
    .references(() => draw.id, { onDelete: "cascade" }),
  tier: integer("tier").notNull(), // 5, 4, or 3
  baseAmount: numeric("base_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  rolloverAmount: numeric("rollover_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
})

export const winnerVerification = pgTable("winner_verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  drawResultId: text("draw_result_id")
    .notNull()
    .references(() => drawResult.id, { onDelete: "cascade" }),
  proofUrl: text("proof_url").notNull(),
  status: verificationStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const donation = pgTable(
  "donation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    charityId: text("charity_id")
      .notNull()
      .references(() => charity.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("donation_userId_idx").on(table.userId),
    index("donation_charityId_idx").on(table.charityId),
  ]
)

export const jackpotRollover = pgTable("jackpot_rollover", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fromDrawId: text("from_draw_id")
    .notNull()
    .references(() => draw.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── Relations ──

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  scores: many(golfScore),
  drawResults: many(drawResult),
  donations: many(donation),
  charity: one(charity, {
    fields: [user.charityId],
    references: [charity.id],
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const charityRelations = relations(charity, ({ many }) => ({
  users: many(user),
  donations: many(donation),
}))

export const golfScoreRelations = relations(golfScore, ({ one }) => ({
  user: one(user, {
    fields: [golfScore.userId],
    references: [user.id],
  }),
}))

export const drawRelations = relations(draw, ({ many }) => ({
  results: many(drawResult),
  prizePools: many(prizePool),
  rollovers: many(jackpotRollover),
}))

export const drawResultRelations = relations(drawResult, ({ one, many }) => ({
  draw: one(draw, {
    fields: [drawResult.drawId],
    references: [draw.id],
  }),
  user: one(user, {
    fields: [drawResult.userId],
    references: [user.id],
  }),
  verifications: many(winnerVerification),
}))

export const prizePoolRelations = relations(prizePool, ({ one }) => ({
  draw: one(draw, {
    fields: [prizePool.drawId],
    references: [draw.id],
  }),
}))

export const winnerVerificationRelations = relations(
  winnerVerification,
  ({ one }) => ({
    drawResult: one(drawResult, {
      fields: [winnerVerification.drawResultId],
      references: [drawResult.id],
    }),
  })
)

export const donationRelations = relations(donation, ({ one }) => ({
  user: one(user, {
    fields: [donation.userId],
    references: [user.id],
  }),
  charity: one(charity, {
    fields: [donation.charityId],
    references: [charity.id],
  }),
}))

export const jackpotRolloverRelations = relations(
  jackpotRollover,
  ({ one }) => ({
    fromDraw: one(draw, {
      fields: [jackpotRollover.fromDrawId],
      references: [draw.id],
    }),
  })
)
