import { Hono } from "hono"
import { db } from "@/db"
import { charity, user } from "@/db/schema"
import { eq, ilike, or } from "drizzle-orm"
import { auth } from "@/lib/auth"

export const charitiesRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

// GET /api/charities
charitiesRoutes.get("/charities", async (c) => {
  const search = c.req.query("search") || ""
  let charities
  if (search) {
    charities = await db
      .select()
      .from(charity)
      .where(
        or(
          ilike(charity.name, `%${search}%`),
          ilike(charity.description, `%${search}%`)
        )
      )
  } else {
    charities = await db.select().from(charity)
  }
  return c.json(charities)
})

// GET /api/charities/:id
charitiesRoutes.get("/charities/:id", async (c) => {
  const id = c.req.param("id")
  const [ch] = await db.select().from(charity).where(eq(charity.id, id))
  if (!ch) return c.json({ error: "Not found" }, 404)
  return c.json(ch)
})

// GET /api/user/charity — get current user's charity selection
charitiesRoutes.get("/user/charity", async (c) => {
  const u = c.get("user")
  if (!u) return c.json({ error: "Unauthorized" }, 401)
  const [row] = await db
    .select({ charityId: user.charityId, charityPercentage: user.charityPercentage })
    .from(user)
    .where(eq(user.id, u.id))
  return c.json(row || { charityId: null, charityPercentage: 10 })
})

// PUT /api/user/charity — update user's charity selection
charitiesRoutes.put("/user/charity", async (c) => {
  const u = c.get("user")
  if (!u) return c.json({ error: "Unauthorized" }, 401)
  const { charityId, charityPercentage } = await c.req.json()
  if (charityPercentage < 10) {
    return c.json({ error: "Minimum contribution is 10%" }, 400)
  }
  // Verify charity exists
  const [ch] = await db.select().from(charity).where(eq(charity.id, charityId))
  if (!ch) return c.json({ error: "Charity not found" }, 404)

  await db
    .update(user)
    .set({ charityId, charityPercentage })
    .where(eq(user.id, u.id))

  return c.json({ success: true })
})
