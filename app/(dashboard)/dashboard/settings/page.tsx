"use client"

import { useSession, signOut } from "@/lib/auth-client"
import { useState } from "react"
import {
  Settings,
  User,
  CreditCard,
  Bell,
  LogOut,
  ExternalLink,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptions"
import { SubscriptionCard } from "@/components/subscription-card"

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    setSubscribing(true)
    try {
      const res = await api.post("/subscription/checkout", { plan })
      const data = res.data
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.success("Subscription activated!")
        router.refresh()
      }
    } catch (error: any) {
      const errMessage = error.response?.data?.error || "Subscription failed"
      toast.error(errMessage)
    } finally {
      setSubscribing(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const res = await api.post("/subscription/portal")
      const data = res.data
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Failed to open billing portal")
    }
  }


  const userRole = (session?.user as Record<string, unknown>)?.role as string
  const subStatus = ((session?.user as Record<string, unknown>)?.subscriptionStatus || "none") as string

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, subscription, and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={session?.user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={session?.user?.email || ""} disabled />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                userRole === "admin"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }
            >
              {userRole === "admin" ? "Administrator" : "Member"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subStatus === "active" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-semibold">Active Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    Your subscription is active and you&apos;re eligible for
                    draws.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleManageSubscription}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Subscribe to enter monthly prize draws and support your chosen
                charity.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <SubscriptionCard
                    key={plan.id}
                    plan={plan}
                    onSubscribe={handleSubscribe}
                    isLoading={subscribing}
                  />
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Notifications placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email notifications for draw results, winner alerts, and system
            updates will be sent to {session?.user?.email}.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" />
            Sign Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              signOut()
              router.push("/")
            }}
          >
            Sign Out of BirdieFund
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
