"use client"

import { useEffect, useState, useCallback } from "react"
import { Heart, Plus, Pencil, Trash2 } from "lucide-react"
import { CharityCard } from "@/components/charity-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface Charity {
  id: string
  name: string
  description: string
  image: string | null
  website: string | null
  featured: boolean
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Charity | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    featured: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetch_ = useCallback(async () => {
    try {
      const r = await api.get("/admin/charities")
      setCharities(r.data)
    } catch {
      toast.error("Failed to load charities")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetch_()
  }, [fetch_])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await api.put(`/admin/charities/${editing.id}`, form)
      } else {
        await api.post("/admin/charities", form)
      }
      toast.success(editing ? "Charity updated!" : "Charity created!")
      setOpen(false)
      setEditing(null)
      setForm({ name: "", description: "", website: "", featured: false })
      fetch_()
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this charity?")) return
    try {
      await api.delete(`/admin/charities/${id}`)
      toast.success("Deleted")
      fetch_()
    } catch {
      toast.error("Failed")
    }
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Charities
          </h1>
          <p className="mt-1 text-muted-foreground">
            Add, edit, and manage charity listings.
          </p>
        </div>
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => {
            setEditing(null)
            setForm({ name: "", description: "", website: "", featured: false })
            setOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Charity
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : charities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {charities.map((c) => (
            <CharityCard
              key={c.id}
              charity={c}
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1"
                    onClick={() => {
                      setEditing(c)
                      setForm({
                        name: c.name,
                        description: c.description,
                        website: c.website || "",
                        featured: c.featured,
                      })
                      setOpen(true)
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              }
            />
          ))}
        </div>

      ) : (
        <Card className="p-12 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
          <h3 className="font-semibold">No charities</h3>
          <Button
            className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Charity
          </Button>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Charity</DialogTitle>
            <DialogDescription>
              Fill in the charity details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                required
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                value={form.website}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
              />
              <Label>Featured on homepage</Label>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Charity"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
