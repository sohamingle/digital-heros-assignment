import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import { admin } from "better-auth/plugins"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
      subscriptionStatus: {
        type: "string",
        defaultValue: "none",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
  baseURL: {
    allowedHosts: ["n8n.sohamingle.me", "localhost:*"],
    fallback: process.env.NEXT_PUBLIC_API_URL,
  },
})
