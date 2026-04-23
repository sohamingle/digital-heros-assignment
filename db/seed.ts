import "dotenv/config"
import { db } from "./index"
import { charity, user } from "./schema"
import { eq } from "drizzle-orm"

async function seed() {
  console.log("🌱 Seeding database...")

  // Add charities
  const charities = [
    {
      name: "Green Fairway Foundation",
      description:
        "Supporting youth development through golf and education in underserved communities.",
      website: "https://example.org/green-fairway",
      featured: true,
      events: [
        {
          title: "Junior Open Day",
          date: "2026-06-15",
          description: "A day of free coaching for local kids.",
        },
      ],
    },
    {
      name: "Hearts & Putts",
      description:
        "Providing cardiac care and research funding through charity golf tournaments.",
      website: "https://example.org/hearts-putts",
      featured: true,
      events: [],
    },
    {
      name: "Ocean Clean Golf",
      description:
        "Removing plastic from oceans with every birdie made on participating courses.",
      website: "https://example.org/ocean-clean",
      featured: false,
      events: [
        {
          title: "Beach Cleanup & Pitch",
          date: "2026-07-20",
          description: "Join us for a cleanup followed by a mini-golf session.",
        },
      ],
    },
    {
      name: "Birdies for Brains",
      description:
        "Funding neurological research and support for families affected by Alzheimers.",
      website: "https://example.org/birdies-brains",
      featured: false,
      events: [],
    },
  ]

  for (const c of charities) {
    const existing = await db
      .select()
      .from(charity)
      .where(eq(charity.name, c.name))
    if (existing.length === 0) {
      await db.insert(charity).values(c)
      console.log(`✅ Added charity: ${c.name}`)
    }
  }

  console.log("✨ Seeding complete!")
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err)
  process.exit(1)
})
