"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import {
  Trophy,
  Target,
  Heart,
  Ticket,
  Clock,
  TrendingUp,
  Plus,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface DashboardData {
  subscription: {
    status: string
    plan: string | null
    expiresAt: string | null
  }
  scores: {
    id: string
    score: number
    playedDate: string
  }[]
  charity: {
    id: string
    name: string
    percentage: number
  } | null
  draws: {
    entered: number
    upcoming: string | null
  }
  winnings: {
    total: string
    pending: number
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get("/dashboard")
        setData(res.data)
      } catch (error) {
        console.error("Failed to fetch dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    none: "bg-gray-500/10 text-gray-500",
    cancelled: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    lapsed: "bg-red-500/10 text-red-500",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0] || "Golfer"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of your BirdieFund activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Subscription */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscription
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              className={`text-xs ${statusColors[data?.subscription.status || "none"]}`}
            >
              {(data?.subscription.status || "none").toUpperCase()}
            </Badge>
            {data?.subscription.plan && (
              <p className="mt-2 text-sm text-muted-foreground">
                {data.subscription.plan === "yearly" ? "Annual" : "Monthly"}{" "}
                plan
              </p>
            )}
            {data?.subscription.expiresAt && (
              <p className="text-xs text-muted-foreground">
                Renews{" "}
                {new Date(data.subscription.expiresAt).toLocaleDateString()}
              </p>
            )}
            {data?.subscription.status === "none" && (
              <Link href="/dashboard/settings">
                <Button
                  size="sm"
                  className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Subscribe Now
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Scores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest Scores
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data?.scores && data.scores.length > 0 ? (
              <>
                <p className="text-2xl font-bold">
                  {data.scores.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / 5
                  </span>
                </p>
                <div className="mt-2 flex gap-1.5">
                  {data.scores.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      {s.score}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">No scores yet</p>
                <Link href="/dashboard/scores">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-1 h-3 w-3" /> Add Scores
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Charity
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data?.charity ? (
              <>
                <p className="font-semibold">{data.charity.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contributing {data.charity.percentage}%
                </p>
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  No charity selected
                </p>
                <Link href="/dashboard/charities">
                  <Button variant="outline" size="sm" className="mt-3">
                    Choose Charity
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Winnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Winnings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{data?.winnings?.total || "0.00"}
            </p>
            {(data?.winnings?.pending ?? 0) > 0 && (
              <p className="mt-1 text-sm text-amber-500">
                {data?.winnings.pending} pending verification
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick score entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-emerald-500" />
              Recent Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.scores && data.scores.length > 0 ? (
              <div className="space-y-3">
                {data.scores.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                        {s.score}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(s.playedDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/scores">
                  <Button variant="outline" className="w-full">
                    Manage Scores
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Enter your first score to get started
                </p>
                <Link href="/dashboard/scores">
                  <Button className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Score
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming draw */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5 text-amber-500" />
              Next Draw
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <p className="font-semibold">
                {data?.draws?.upcoming
                  ? `Draw scheduled for ${new Date(data.draws.upcoming).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
                  : "Next draw coming soon"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.draws?.entered
                  ? `You've entered ${data.draws.entered} draw${data.draws.entered > 1 ? "s" : ""}`
                  : "Enter your scores to participate"}
              </p>
              <Link href="/dashboard/draws">
                <Button variant="outline" className="mt-4">
                  View Draws
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
