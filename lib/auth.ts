import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
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
})
