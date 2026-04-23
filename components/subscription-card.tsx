"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SubscriptionPlan } from "@/lib/subscriptions"

interface SubscriptionCardProps {
  plan: SubscriptionPlan
  onSubscribe: (id: "monthly" | "yearly") => void
  isLoading?: boolean
  disabled?: boolean
}

export function SubscriptionCard({
  plan,
  onSubscribe,
  isLoading,
  disabled,
}: SubscriptionCardProps) {
  const isYearly = plan.id === "yearly"

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border p-8 transition-all hover:shadow-lg",
        isYearly
          ? "border-emerald-500/30 bg-emerald-500/[0.02] shadow-emerald-500/5"
          : "border-border bg-card"
      )}
    >
      {isYearly && plan.savings && (
        <div className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow-sm">
          {plan.savings}
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {plan.name}
        </p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight">
            ₹{plan.price}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            /{plan.interval === "month" ? "mo" : "yr"}
          </span>
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-4">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-tight">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={cn(
          "h-11 w-full font-bold",
          isYearly
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "hover:bg-accent"
        )}
        variant={isYearly ? "default" : "outline"}
        onClick={() => onSubscribe(plan.id)}
        disabled={disabled || isLoading}
      >
        {isLoading ? "Processing..." : `Subscribe ${plan.name}`}
      </Button>
    </div>
  )
}
