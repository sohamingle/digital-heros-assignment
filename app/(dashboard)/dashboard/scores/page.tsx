"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Target,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface Score {
  id: string
  score: number
  playedDate: string
  createdAt: string
}

export default function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingScore, setEditingScore] = useState<Score | null>(null)
  const [form, setForm] = useState({ score: "", playedDate: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchScores = useCallback(async () => {
    try {
      const res = await api.get("/scores")
      setScores(res.data)
    } catch {
      toast.error("Failed to load scores")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScores()
  }, [fetchScores])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post("/scores", {
        score: parseInt(form.score),
        playedDate: form.playedDate,
      })
      toast.success("Score added!")
      setForm({ score: "", playedDate: "" })
      setAddOpen(false)
      fetchScores()
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to add score"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingScore) return
    setSubmitting(true)
    try {
      await api.put(`/scores/${editingScore.id}`, {
        score: parseInt(form.score),
        playedDate: form.playedDate,
      })
      toast.success("Score updated!")
      setEditOpen(false)
      setEditingScore(null)
      fetchScores()
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to update score"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/scores/${id}`)
      toast.success("Score deleted")
      fetchScores()
    } catch {
      toast.error("Failed to delete score")
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Scores</h1>
          <p className="mt-1 text-muted-foreground">
            Enter and manage your latest golf scores (Stableford format, 1-45).
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Score
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Score</DialogTitle>
              <DialogDescription>
                Enter your score in Stableford format (1-45) with the date
                played.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="add-score">Score (1-45)</Label>
                <Input
                  id="add-score"
                  type="number"
                  min={1}
                  max={45}
                  placeholder="36"
                  value={form.score}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, score: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-date">Date Played</Label>
                <Input
                  id="add-date"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={form.playedDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, playedDate: e.target.value }))
                  }
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Score"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">
            Rolling 5-Score System
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Only your latest 5 scores count toward each monthly draw. When you
            add a 6th score, the oldest is automatically removed. Only one score
            per date is allowed.
          </p>
        </div>
      </div>

      {/* Score cards */}
      {scores.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {scores.map((s, i) => (
            <Card
              key={s.id}
              className={`relative overflow-hidden transition-all hover:shadow-md ${
                i === 0
                  ? "border-emerald-500/30 shadow-emerald-500/5"
                  : ""
              }`}
            >
              {i === 0 && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
              )}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(s.playedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                      Latest
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{s.score}</p>
                <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                  Stableford points
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingScore(s)
                      setForm({
                        score: s.score.toString(),
                        playedDate: s.playedDate,
                      })
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 5 - scores.length) }).map(
            (_, i) => (
              <Card
                key={`empty-${i}`}
                className="flex flex-col items-center justify-center border-dashed p-6 text-center"
              >
                <Target className="mb-2 h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">Empty slot</p>
              </Card>
            )
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Target className="mx-auto mb-4 h-16 w-16 text-muted-foreground/20" />
          <h3 className="text-lg font-semibold">No scores yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Start entering your golf scores to participate in monthly draws.
            You need 5 scores to be eligible.
          </p>
          <Button
            className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Score
          </Button>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Score</DialogTitle>
            <DialogDescription>
              Update your score or the date played.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-score">Score (1-45)</Label>
              <Input
                id="edit-score"
                type="number"
                min={1}
                max={45}
                value={form.score}
                onChange={(e) =>
                  setForm((f) => ({ ...f, score: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date Played</Label>
              <Input
                id="edit-date"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={form.playedDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, playedDate: e.target.value }))
                }
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
