"use client"

import { useEffect, useState, useCallback } from "react"
import { Ticket, Plus, Play, Send, Loader2, CalendarDays, Shuffle, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface Draw {
  id: string; month: number; year: number; logic: string; status: string
  drawnNumbers: number[] | null; publishedAt: string | null; createdAt: string
}

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [simulating, setSimulating] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [form, setForm] = useState({ month: String(new Date().getMonth()+1), year: String(new Date().getFullYear()), logic: "random" })
  const [submitting, setSubmitting] = useState(false)

  const fetch_ = useCallback(async () => {
    try {
      const r = await api.get("/admin/draws")
      setDraws(r.data)
    } catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch_() }, [fetch_])

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.post("/admin/draws", {
        month: +form.month,
        year: +form.year,
        logic: form.logic
      })
      toast.success("Draw created!"); setCreateOpen(false); fetch_()
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed"
      toast.error(msg)
    } finally { setSubmitting(false) }
  }

  const simulate = async (id:string) => {
    setSimulating(id)
    try {
      await api.post(`/admin/draws/${id}/simulate`)
      toast.success("Simulation complete!"); fetch_()
    } catch { toast.error("Failed") } finally { setSimulating(null) }
  }

  const publish = async (id:string) => {
    setPublishing(id)
    try {
      await api.post(`/admin/draws/${id}/publish`)
      toast.success("Published!"); fetch_()
    } catch { toast.error("Failed") } finally { setPublishing(null) }
  }


  const sc: Record<string,string> = { draft:"bg-gray-500/10 text-gray-500", simulated:"bg-amber-500/10 text-amber-600 dark:text-amber-400", published:"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Manage Draws</h1><p className="mt-1 text-muted-foreground">Configure, simulate, and publish monthly draws.</p></div>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={()=>setCreateOpen(true)}><Plus className="mr-2 h-4 w-4"/>New Draw</Button>
      </div>

      {loading ? <Skeleton className="h-64"/> : draws.length > 0 ? (
        <div className="space-y-4">{draws.map(d=>(
          <Card key={d.id}>
            <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground"/>{months[d.month-1]} {d.year}</span>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px]">{d.logic==="algorithmic"?<><BarChart3 className="mr-1 h-3 w-3"/>Algo</>:<><Shuffle className="mr-1 h-3 w-3"/>Random</>}</Badge>
                <Badge className={sc[d.status]}>{d.status}</Badge>
              </div>
            </CardTitle></CardHeader>
            <CardContent>
              {d.drawnNumbers&&<div className="mb-4"><p className="mb-2 text-sm font-medium text-muted-foreground">Drawn Numbers</p><div className="flex gap-2">{d.drawnNumbers.map((n,i)=><div key={i} className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-lg font-bold text-emerald-600 dark:text-emerald-400">{n}</div>)}</div></div>}
              <div className="flex gap-2">
                {d.status==="draft"&&<Button variant="outline" onClick={()=>simulate(d.id)} disabled={simulating===d.id}>{simulating===d.id?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Play className="mr-2 h-4 w-4"/>}Simulate</Button>}
                {d.status==="simulated"&&<><Button variant="outline" onClick={()=>simulate(d.id)} disabled={simulating===d.id}>{simulating===d.id?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Play className="mr-2 h-4 w-4"/>}Re-simulate</Button><Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={()=>publish(d.id)} disabled={publishing===d.id}>{publishing===d.id?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Publish</Button></>}
                {d.status==="published"&&d.publishedAt&&<p className="text-sm text-muted-foreground">Published {new Date(d.publishedAt).toLocaleDateString("en-GB")}</p>}
              </div>
            </CardContent>
          </Card>
        ))}</div>
      ) : (
        <Card className="p-12 text-center"><Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20"/><h3 className="font-semibold">No draws yet</h3><Button className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700" onClick={()=>setCreateOpen(true)}><Plus className="mr-2 h-4 w-4"/>Create First Draw</Button></Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>Create New Draw</DialogTitle><DialogDescription>Configure the monthly draw parameters.</DialogDescription></DialogHeader>
        <form onSubmit={create} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Month</Label><Select value={form.month} onValueChange={v=>setForm(f=>({...f,month:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{months.map((m,i)=><SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Year</Label><Select value={form.year} onValueChange={v=>setForm(f=>({...f,year:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["2025","2026","2027"].map(y=><SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Logic</Label><Select value={form.logic} onValueChange={v=>setForm(f=>({...f,logic:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="random">Random</SelectItem><SelectItem value="algorithmic">Algorithmic</SelectItem></SelectContent></Select></div>
          <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={submitting}>{submitting?"Creating...":"Create Draw"}</Button>
        </form>
      </DialogContent></Dialog>
    </div>
  )
}
