import "dotenv/config"
import { db } from "./index"
import { user } from "./schema"
import { eq } from "drizzle-orm"

async function makeAdmin() {
  const email = process.argv[2]
  if (!email) {
    console.error("❌ Please provide an email: pnpm run make-admin <email>")
    process.exit(1)
  }

  const [u] = await db.select().from(user).where(eq(user.email, email))
  if (!u) {
    console.error(`❌ User with email ${email} not found.`)
    process.exit(1)
  }

  await db.update(user).set({ role: "admin" }).where(eq(user.id, u.id))
  console.log(`✅ User ${email} is now an admin!`)
}

makeAdmin().catch(console.error)
