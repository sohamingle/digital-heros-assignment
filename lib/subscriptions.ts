export interface SubscriptionPlan {
  id: "monthly" | "yearly"
  name: string
  price: number
  currency: string
  interval: "month" | "year"
  features: string[]
  stripePriceId?: string
  savings?: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: 499,
    currency: "INR",
    interval: "month",
    features: ["Monthly draw entry", "Score tracking", "Charity support"],
    stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 4499,
    currency: "INR",
    interval: "year",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Priority support",
      "Exclusive winner events",
    ],
    stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID,
    savings: "Save 25%",
  },
]

export const getPlanById = (id: string) =>
  SUBSCRIPTION_PLANS.find((p) => p.id === id)
