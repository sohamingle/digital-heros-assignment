"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Ticket,
  Clock,
  Trophy,
  CalendarDays,
  Hash,
  AlertCircle,
  Upload,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { toast } from "sonner"
import { WinnerProofUpload } from "@/components/winner-proof-upload"

interface Draw {
  id: string
  month: number
  year: number
  status: string
  logic: string
  drawnNumbers: number[] | null
  publishedAt: string | null
  results?: {
    id: string
    matchCount: number
    matchedNumbers: number[] | null
    prizeAmount: string
    paymentStatus: string
    hasVerification: boolean
  }
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  const fetchDraws = useCallback(async () => {
    try {
      const res = await api.get("/draws")
      setDraws(res.data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load draws")
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    fetchDraws()
  }, [fetchDraws])

  // Next draw countdown
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const daysUntil = Math.ceil(
    (nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Draws</h1>
        <p className="mt-1 text-muted-foreground">
          Monthly prize draws based on your golf scores.
        </p>
      </div>

      {/* Next draw countdown */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500" />
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">Next Draw</h2>
              <p className="mt-1 text-muted-foreground">
                {monthNames[nextMonth.getMonth()]} {nextMonth.getFullYear()}{" "}
                draw
              </p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-500">{daysUntil}</p>
              <p className="text-sm text-muted-foreground">days remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How draws work</p>
          <p className="mt-0.5">
            Each month, 5 numbers (1-45) are drawn. Your latest 5 scores are
            compared against these numbers. Match 3 for 25% of the pool, 4 for
            35%, or all 5 for the 40% jackpot. The jackpot rolls over if
            unclaimed!
          </p>
        </div>
      </div>

      {/* Prize pool tiers */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            match: 5,
            share: "40%",
            label: "Jackpot",
            color: "amber",
            emoji: "🏆",
          },
          {
            match: 4,
            share: "35%",
            label: "Second Tier",
            color: "gray",
            emoji: "🥈",
          },
          {
            match: 3,
            share: "25%",
            label: "Third Tier",
            color: "orange",
            emoji: "🥉",
          },
        ].map((tier) => (
          <Card key={tier.match} className="text-center">
            <CardContent className="p-6">
              <span className="text-3xl">{tier.emoji}</span>
              <p className="mt-2 font-semibold">
                {tier.match}-Number Match
              </p>
              <p className="text-2xl font-bold text-emerald-500">
                {tier.share}
              </p>
              <p className="text-xs text-muted-foreground">of prize pool</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Past draws */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Draw History</h2>
        {draws.length > 0 ? (
          <div className="space-y-4">
            {draws.map((d) => (
              <Card key={d.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {monthNames[d.month - 1]} {d.year}
                    </span>
                    <Badge
                      className={
                        d.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }
                    >
                      {d.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {d.drawnNumbers && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">
                        Drawn Numbers
                      </p>
                      <div className="flex gap-2">
                        {d.drawnNumbers.map((n, i) => (
                          <div
                            key={i}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                          >
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.results ? (
                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Your Result</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              d.results.matchCount >= 3
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-gray-500/10 text-gray-500"
                            }
                          >
                            {d.results.matchCount} match
                            {d.results.matchCount !== 1 ? "es" : ""}
                          </Badge>
                          {parseFloat(d.results.prizeAmount) > 0 && (
                            <div className="flex flex-col items-end gap-2">
                              <span className="font-bold text-emerald-500">
                                ₹
                                {parseFloat(d.results.prizeAmount).toFixed(2)}
                              </span>
                              {!d.results.hasVerification ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px]"
                                  onClick={() => {
                                    setSelectedResultId(d.results?.id || null)
                                    setUploadOpen(true)
                                  }}
                                >
                                  <Upload className="mr-1 h-3 w-3" />
                                  Upload Proof
                                </Button>
                              ) : (
                                <Badge variant="outline" className="h-6 text-[10px] text-emerald-500">
                                  Verification Sent
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {d.results.matchedNumbers &&
                        d.results.matchedNumbers.length > 0 && (
                          <div className="mt-2 flex gap-1.5">
                            {d.results.matchedNumbers.map((n, i) => (
                              <span
                                key={i}
                                className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  ) : d.status === "published" ? (
                    <p className="text-sm text-muted-foreground">
                      You did not participate in this draw.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
            <h3 className="font-semibold">No draws yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The first draw will be announced soon. Make sure your scores are
              entered!
            </p>
          </Card>
        )}
      </div>
      {selectedResultId && (
        <WinnerProofUpload
          drawResultId={selectedResultId}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onSuccess={fetchDraws}
        />
      )}
    </div>
  )
}
