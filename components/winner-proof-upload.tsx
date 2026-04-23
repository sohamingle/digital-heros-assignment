"use client"

import { useState } from "react"
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { toast } from "sonner"

interface WinnerProofUploadProps {
  drawResultId: string
  onSuccess: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WinnerProofUpload({
  drawResultId,
  onSuccess,
  open,
  onOpenChange,
}: WinnerProofUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) return

    // 1MB Limit
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB")
      return
    }

    setUploading(true)

    try {
      // Direct upload to our server
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await api.post("/upload/direct", formData)
      const { url: proofUrl } = uploadRes.data

      // 3. Save verification request
      await api.post("/draws/verify", {
        drawResultId,
        proofUrl,
      })

      toast.success("Proof uploaded successfully! Admin will review it.")
      onSuccess()
      onOpenChange(false)
      setFile(null) // Reset file after success
    } catch (error: any) {
      console.error("Upload process failed:", error)
      const message = error.response?.data?.error || error.message || "Failed to upload proof. Please try again."
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Winner Proof</DialogTitle>
          <DialogDescription>
            Please upload a screenshot of your scores from the golf platform to
            verify your winnings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all ${
              file
                ? "border-emerald-500/50 bg-emerald-500/[0.02]"
                : "border-border hover:border-emerald-500/30"
            }`}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile && selectedFile.size > 1024 * 1024) {
                  toast.error("File is too large. Maximum size is 1MB.")
                  return
                }
                setFile(selectedFile || null)
              }}
              disabled={uploading}
            />

            {file ? (
              <div className="flex flex-col items-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  className="mt-4 text-xs font-medium text-destructive hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">Click or drag to upload</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG or WebP (max 1MB)
                </p>
              </div>
            )}
          </div>

          <Button
            className="w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading Proof...
              </>
            ) : (
              "Submit Proof"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
