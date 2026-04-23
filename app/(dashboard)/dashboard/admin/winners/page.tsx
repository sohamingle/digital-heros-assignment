"use client"

import { useEffect, useState, useCallback } from "react"
import { Gift, Check, X, Eye, ExternalLink, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface Winner {
  id: string
  userName: string
  userEmail: string
  drawMonth: number
  drawYear: number
  matchCount: number
  prizeAmount: string
  paymentStatus: string
  verification: {
    id: string
    proofUrl: string
    status: string
    adminNotes: string | null
  } | null
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [proofOpen, setProofOpen] = useState(false)
  const [selected, setSelected] = useState<Winner | null>(null)
  const [notes, setNotes] = useState("")

  const fetch_ = useCallback(async () => {
    try {
      const r = await api.get("/admin/winners")
      setWinners(r.data)
    } catch {
      toast.error("Failed to load winners")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetch_()
  }, [fetch_])

  const verify = async (id: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/admin/winners/${id}/verify`, {
        status,
        adminNotes: notes,
      })
      toast.success(`Verification ${status}`)
      setProofOpen(false)
      fetch_()
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed"
      toast.error(msg)
    }
  }

  const markPaid = async (id: string) => {
    try {
      await api.put(`/admin/winners/${id}/payout`)
      toast.success("Marked as paid")
      fetch_()
    } catch {
      toast.error("Failed")
    }
  }


  const vc: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rejected: "bg-red-500/10 text-red-500",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Winners</h1>
        <p className="mt-1 text-muted-foreground">
          View winners, verify proofs, and manage payouts.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : winners.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Winner</TableHead>
                  <TableHead>Draw</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <p className="font-medium">{w.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.userEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      {months[w.drawMonth - 1]} {w.drawYear}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {w.matchCount} matches
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{parseFloat(w.prizeAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {w.verification ? (
                        <Badge className={vc[w.verification.status]}>
                          {w.verification.status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No proof
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          w.paymentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }
                      >
                        {w.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {w.verification && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelected(w)
                              setNotes(w.verification?.adminNotes || "")
                              setProofOpen(true)
                            }}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Review
                          </Button>
                        )}
                        {w.paymentStatus === "pending" &&
                          w.verification?.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markPaid(w.id)}
                            >
                              <DollarSign className="mr-1 h-3 w-3" />
                              Pay
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Gift className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
          <h3 className="font-semibold">No winners yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Winners will appear after a draw is published.
          </p>
        </Card>
      )}

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Proof</DialogTitle>
            <DialogDescription>
              Review the winner&apos;s uploaded proof of scores.
            </DialogDescription>
          </DialogHeader>
          {selected?.verification && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="mb-2 block">Proof Screenshot</Label>
                <img
                  src={selected.verification.proofUrl}
                  alt="proof"
                  className="h-64 w-auto rounded-md"
                />
              </div>
              <div>
                <Label className="mb-2 block">Admin Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => verify(selected.id, "approved")}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive"
                  onClick={() => verify(selected.id, "rejected")}
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
