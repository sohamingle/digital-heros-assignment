"use client"

import { useEffect, useState, useCallback } from "react"
import { Heart, Search, Star, ExternalLink, Percent } from "lucide-react"
import { CharityCard } from "@/components/charity-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Charity {
  id: string
  name: string
  description: string
  image: string | null
  website: string | null
  featured: boolean
  events: { title: string; date: string; description: string }[] | null
}

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null)
  const [selectOpen, setSelectOpen] = useState(false)
  const [percentage, setPercentage] = useState(10)
  const [userCharityId, setUserCharityId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchCharities = useCallback(async () => {
    try {
      const res = await api.get("/charities", {
        params: { search },
      })
      setCharities(res.data)
    } catch {
      toast.error("Failed to load charities")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchCharities()
  }, [fetchCharities])

  useEffect(() => {
    // Fetch user's current charity
    async function fetchUserCharity() {
      try {
        const res = await api.get("/user/charity")
        const data = res.data
        if (data.charityId) setUserCharityId(data.charityId)
        if (data.charityPercentage) setPercentage(data.charityPercentage)
      } catch (error) {
        console.error("Failed to fetch user charity:", error)
      }
    }
    fetchUserCharity()
  }, [])

  const handleSelectCharity = async () => {
    if (!selectedCharity) return
    setSubmitting(true)
    try {
      await api.put("/user/charity", {
        charityId: selectedCharity.id,
        charityPercentage: percentage,
      })
      toast.success(`Now supporting ${selectedCharity.name}!`)
      setUserCharityId(selectedCharity.id)
      setSelectOpen(false)
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to update charity"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const featured = charities.filter((c) => c.featured)
  const filtered = charities.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charities</h1>
        <p className="mt-1 text-muted-foreground">
          Choose a charity to support with a portion of your subscription.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search charities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Featured */}
      {featured.length > 0 && !search && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Star className="h-5 w-5 text-amber-500" />
            Featured Charities
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((c) => (
              <CharityCard
                key={c.id}
                charity={c}
                isChoice={userCharityId === c.id}
                actions={
                  <Button
                    size="sm"
                    className="h-8 flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      setSelectedCharity(c)
                      setSelectOpen(true)
                    }}
                  >
                    <Heart className="mr-1.5 h-3.5 w-3.5" />
                    {userCharityId === c.id ? "Update" : "Select"}
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* All charities */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {search ? "Search Results" : "All Charities"}
        </h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CharityCard
                key={c.id}
                charity={c}
                isChoice={userCharityId === c.id}
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1"
                    onClick={() => {
                      setSelectedCharity(c)
                      setSelectOpen(true)
                    }}
                  >
                    <Heart className="mr-1.5 h-3.5 w-3.5" />
                    {userCharityId === c.id ? "Update" : "Select"}
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-muted-foreground">
              {search
                ? "No charities match your search."
                : "No charities listed yet."}
            </p>
          </div>
        )}
      </div>

      {/* Select charity dialog */}
      <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support {selectedCharity?.name}</DialogTitle>
            <DialogDescription>
              Choose what percentage of your subscription goes to this charity
              (minimum 10%).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Contribution: {percentage}%
              </Label>
              <Slider
                value={[percentage]}
                onValueChange={(v) => setPercentage(v[0])}
                min={10}
                max={50}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10%. Increase to make a bigger impact!
              </p>
            </div>

            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleSelectCharity}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : `Confirm ${percentage}% to ${selectedCharity?.name}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
