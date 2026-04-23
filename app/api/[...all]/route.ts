import { auth } from "@/lib/auth"
import { Hono } from "hono"
import { handle } from "hono/vercel"
import { scoresRoutes } from "./routes/scores"
import { charitiesRoutes } from "./routes/charities"
import { drawsRoutes } from "./routes/draws"
import { adminRoutes } from "./routes/admin"
import { dashboardRoutes } from "./routes/dashboard"
import { subscriptionRoutes } from "./routes/subscription"
import { uploadRoutes } from "./routes/upload"

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()
  .basePath("/api")
  .use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      c.set("user", null)
      c.set("session", null)
      await next()
      return
    }
    c.set("user", session.user)
    c.set("session", session.session)
    await next()
  })
  // ── Feature routes ──
  .route("/", scoresRoutes)
  .route("/", charitiesRoutes)
  .route("/", drawsRoutes)
  .route("/", adminRoutes)
  .route("/", dashboardRoutes)
  .route("/", subscriptionRoutes)
  .route("/", uploadRoutes)

// ── Auth routes ──
app.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

// ── Session endpoint ──
app.get("/session", (c) => {
  const session = c.get("session")
  const user = c.get("user")
  if (!user) return c.body(null, 401)
  return c.json({ session, user })
})

export type AppType = typeof app

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
