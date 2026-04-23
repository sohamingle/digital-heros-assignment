"use client"

import { Heart, Star, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Charity {
  id: string
  name: string
  description: string
  image?: string | null
  website?: string | null
  featured?: boolean
  events?: any[] | null
}

interface CharityCardProps {
  charity: Charity
  isChoice?: boolean
  actions?: React.ReactNode
  className?: string
}

export function CharityCard({
  charity,
  isChoice,
  actions,
  className,
}: CharityCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden transition-all hover:shadow-md",
        charity.featured && "border-amber-500/20",
        className
      )}
    >
      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
              <Heart className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h3 className="leading-none font-semibold">{charity.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {charity.featured && (
                  <Badge className="border-none bg-amber-500/10 px-1.5 py-0 text-[10px] font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">
                    <Star className="mr-0.5 h-2.5 w-2.5 fill-current" />
                    Featured
                  </Badge>
                )}
                {isChoice && (
                  <Badge className="border-none bg-emerald-500/10 px-1.5 py-0 text-[10px] font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                    Your Choice
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {charity.description}
        </p>

        {charity.events && charity.events.length > 0 && (
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            📅 {charity.events.length} upcoming event
            {charity.events.length > 1 ? "s" : ""}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {actions}
          {charity.website && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5"
              asChild
              title="Visit Website"
            >
              <a
                href={charity.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
