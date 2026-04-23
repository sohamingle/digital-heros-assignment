import { Hono } from "hono"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptions"
import type Stripe from "stripe"

export const subscriptionRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

// POST /api/subscription/checkout — create a checkout session
subscriptionRoutes.post("/subscription/checkout", async (c) => {
  const u = c.get("user")
  if (!u) return c.json({ error: "Unauthorized" }, 401)

  const { plan } = await c.req.json()
  if (!plan || !["monthly", "yearly"].includes(plan)) {
    return c.json({ error: "Invalid plan" }, 400)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (stripeKey) {
    const stripe = (await import("stripe")).default
    const stripeClient = new stripe(stripeKey)

    let customerId = (u as any).stripeCustomerId as string | null
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: u.email,
        name: u.name,
        metadata: { userId: u.id },
      })
      customerId = customer.id
      await db
        .update(user)
        .set({ stripeCustomerId: customerId })
        .where(eq(user.id, u.id))
    }

    const planData = SUBSCRIPTION_PLANS.find((p) => p.id === plan)
    if (!planData || !planData.stripePriceId) {
      return c.json({ error: "Price not configured for this plan" }, 500)
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: planData.stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?cancelled=true`,
      metadata: { userId: u.id, plan },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    })

    return c.json({ url: session.url })
  }

  // Demo mode: directly activate subscription
  const expiresAt = new Date()
  if (plan === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  }

  await db
    .update(user)
    .set({
      subscriptionStatus: "active",
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiresAt,
    })
    .where(eq(user.id, u.id))

  return c.json({
    success: true,
    message: "Subscription activated (demo mode)",
  })
})

// POST /api/subscription/portal — billing portal
subscriptionRoutes.post("/subscription/portal", async (c) => {
  const u = c.get("user")
  if (!u) return c.json({ error: "Unauthorized" }, 401)

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return c.json({ error: "Stripe not configured" }, 500)
  }

  const customerId = (u as any).stripeCustomerId as string
  if (!customerId) {
    return c.json({ error: "No billing account found" }, 400)
  }

  const stripe = (await import("stripe")).default
  const stripeClient = new stripe(stripeKey)
  const portalSession = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  })

  return c.json({ url: portalSession.url })
})

// POST /api/subscription/webhook
subscriptionRoutes.post("/subscription/webhook", async (c) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    console.error("❌ Stripe webhook configuration missing")
    return c.json({ error: "Configuration missing" }, 500)
  }

  const stripe = (await import("stripe")).default
  const stripeClient = new stripe(stripeKey)

  const signature = c.req.header("stripe-signature")
  if (!signature) return c.json({ error: "No signature" }, 400)

  let event: Stripe.Event
  try {
    const body = await c.req.text()
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`)
    return c.json({ error: `Webhook Error: ${err.message}` }, 400)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as "monthly" | "yearly"
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (userId && plan) {
          const expiresAt =
            plan === "yearly"
              ? new Date(Date.now() + 24 * 60 * 60 * 1000 * 365)
              : new Date(Date.now() + 24 * 60 * 60 * 1000)

          await db
            .update(user)
            .set({
              subscriptionStatus: "active",
              subscriptionPlan: plan,
              subscriptionExpiresAt: expiresAt,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
            })
            .where(eq(user.id, userId))

          console.log(`✅ Subscription activated for user ${userId}`)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const plan = subscription.metadata?.plan as "monthly" | "yearly"
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
              ? "lapsed"
              : "cancelled"
        const expiresAt =
          plan === "yearly"
            ? new Date(Date.now() + 24 * 60 * 60 * 1000 * 365)
            : new Date(Date.now() + 24 * 60 * 60 * 1000)

        await db
          .update(user)
          .set({
            subscriptionStatus: status,
            subscriptionExpiresAt: expiresAt,
          })
          .where(eq(user.stripeCustomerId, customerId))

        console.log(`ℹ️ Subscription updated for customer ${customerId}`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await db
          .update(user)
          .set({
            subscriptionStatus: "cancelled",
            subscriptionPlan: null,
            subscriptionExpiresAt: null,
            stripeSubscriptionId: null,
          })
          .where(eq(user.stripeCustomerId, customerId))

        console.log(`❌ Subscription deleted for customer ${customerId}`)
        break
      }
    }

    return c.json({ received: true })
  } catch (err: any) {
    console.error(`❌ Webhook handling error: ${err.message}`)
    return c.json({ error: "Webhook handler failed" }, 500)
  }
})

// GET /api/subscription/status
subscriptionRoutes.get("/subscription/status", async (c) => {
  const u = c.get("user")
  if (!u) return c.json({ error: "Unauthorized" }, 401)

  const [userData] = await db
    .select({
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      expiresAt: user.subscriptionExpiresAt,
    })
    .from(user)
    .where(eq(user.id, u.id))

  return c.json(userData || { status: "none", plan: null, expiresAt: null })
})
