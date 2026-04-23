"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ShieldCheck,
  Users,
  Trophy,
  Heart,
  TrendingUp,
  Ticket,
  DollarSign,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminStats {
  totalUsers: number
  activeSubscribers: number
  totalPrizePool: string
  totalCharityContributions: string
  totalDraws: number
  pendingVerifications: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/reports")
      setStats(res.data)
    } catch {
      console.error("Failed to fetch admin stats")
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Active Subscribers",
      value: stats?.activeSubscribers ?? 0,
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Prize Pool",
      value: `₹${stats?.totalPrizePool ?? "0.00"}`,
      icon: Trophy,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Charity Donations",
      value: `₹${stats?.totalCharityContributions ?? "0.00"}`,
      icon: Heart,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      label: "Total Draws",
      value: stats?.totalDraws ?? 0,
      icon: Ticket,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      label: "Pending Verifications",
      value: stats?.pendingVerifications ?? 0,
      icon: DollarSign,
      color: "text-orange-500 bg-orange-500/10",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Platform overview and management tools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Manage Users",
            href: "/dashboard/admin/users",
            icon: Users,
            color: "emerald",
          },
          {
            label: "Manage Draws",
            href: "/dashboard/admin/draws",
            icon: Ticket,
            color: "amber",
          },
          {
            label: "Manage Charities",
            href: "/dashboard/admin/charities",
            icon: Heart,
            color: "rose",
          },
          {
            label: "View Reports",
            href: "/dashboard/admin/reports",
            icon: TrendingUp,
            color: "blue",
          },
        ].map((link) => (
          <a key={link.href} href={link.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <link.icon className={`h-5 w-5 text-${link.color}-500`} />
                <span className="font-medium">{link.label}</span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
