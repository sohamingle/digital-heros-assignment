"use client"

import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { AuthModal } from "@/components/auth-modal"
import {
  ArrowRight,
  Trophy,
  Heart,
  Target,
  TrendingUp,
  Shield,
  Sparkles,
  ChevronRight,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

/* ── Animated counter hook ── */
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export default function LandingPage() {
  const { data: session, isPending } = useSession()
  const prizePool = useAnimatedCounter(12450)
  const members = useAnimatedCounter(842)
  const donated = useAnimatedCounter(34200)

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-emerald-500/30">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-amber-500/[0.05] blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-2xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Birdie<span className="text-emerald-400">Fund</span>
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#prizes"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Prizes
            </a>
            <a
              href="#charities"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Charities
            </a>
          </div>

          <div className="flex items-center gap-3">
            {!isPending && session ? (
              <Link href="/dashboard">
                <Button className="rounded-full bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700">
                  Dashboard
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <AuthModal>
                <Button className="rounded-full bg-foreground px-6 font-semibold text-background hover:bg-foreground/90">
                  Sign In
                </Button>
              </AuthModal>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
        {/* Background Image with Dynamic Masking */}
        <div className="absolute inset-0">
          <img src="/hero.webp" alt="" className="h-full w-full object-cover" />
          {/* Mobile-optimized overlay: Vertical gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background lg:hidden" />
          {/* Desktop-optimized overlay: Horizontal gradient */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-background via-background/80 to-transparent lg:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-b from-transparent via-transparent to-background lg:block" />
        </div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="flex max-w-4xl animate-in flex-col items-center text-center duration-1000 fade-in slide-in-from-bottom-8 lg:items-start lg:text-left lg:slide-in-from-left-8">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs md:text-sm">
              <Sparkles className="h-3 w-3 text-emerald-600 md:h-4 md:w-4" />
              <span className="font-semibold text-emerald-700">
                Monthly draws • Real prizes • Real impact
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-black tracking-tight drop-shadow-sm md:text-6xl lg:text-8xl">
              Play. Win. <br className="hidden lg:block" />
              <span className="gradient-text drop-shadow-md">Give Back.</span>
            </h1>

            {/* Subheadline */}
            <div className="relative mb-10 max-w-xl">
              <p className="text-base leading-relaxed text-foreground/80 drop-shadow-sm md:text-lg lg:text-xl">
                Enter your golf scores, compete in monthly prize draws, and
                support charities you care about — all from one modern platform.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              {session ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="group h-14 w-full rounded-full bg-emerald-600 px-10 text-lg font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 sm:w-auto"
                  >
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <AuthModal>
                  <div className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="group h-14 w-full rounded-full bg-emerald-600 px-10 text-lg font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 sm:w-auto"
                    >
                      Join the Club — Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </AuthModal>
              )}
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full rounded-full border-border/50 bg-background/50 px-10 text-lg font-semibold backdrop-blur-md transition-all hover:bg-muted sm:w-auto"
                >
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Live Stats Bar - Responsive grid */}
          <div className="mt-16 grid w-full max-w-4xl animate-in grid-cols-1 gap-4 delay-300 duration-1000 fade-in slide-in-from-bottom-8 md:grid-cols-3 lg:mt-20">
            <div className="glass group rounded-3xl p-6 text-center transition-all hover:border-emerald-500/30 hover:bg-white/80">
              <p className="text-3xl font-black text-emerald-500 md:text-4xl lg:text-5xl">
                ₹{prizePool.toLocaleString()}
              </p>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Current Prize Pool
              </p>
            </div>
            <div className="glass group rounded-3xl p-6 text-center transition-all hover:border-amber-500/30 hover:bg-white/80">
              <p className="text-3xl font-black text-amber-500 md:text-4xl lg:text-5xl">
                {members.toLocaleString()}
              </p>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Active Members
              </p>
            </div>
            <div className="glass group rounded-3xl p-6 text-center transition-all hover:border-rose-500/30 hover:bg-white/80">
              <p className="text-3xl font-black text-rose-500 md:text-4xl lg:text-5xl">
                ₹{donated.toLocaleString()}
              </p>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Donated to Charity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="border-t border-border py-24 lg:py-32"
      >
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold tracking-widest text-emerald-400 uppercase">
              Simple as 1-2-3
            </p>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              How It Works
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Shield,
                title: "Subscribe",
                desc: "Choose a monthly or yearly plan. A portion goes to the prize pool, and a portion to your chosen charity.",
                color: "emerald",
              },
              {
                step: "02",
                icon: Target,
                title: "Enter Scores",
                desc: "Log your latest golf scores in Stableford format. Keep your last 5 scores updated to stay in the draw.",
                color: "amber",
              },
              {
                step: "03",
                icon: Trophy,
                title: "Win & Give",
                desc: "Each month, a draw matches your scores. Match 3, 4, or all 5 to win. No match? Your charity still benefits.",
                color: "rose",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-emerald-500/30 hover:bg-muted/50"
              >
                <span className="mb-4 block text-5xl font-black text-muted-foreground/30">
                  {item.step}
                </span>
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                    item.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : item.color === "amber"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Tiers */}
      <section id="prizes" className="border-t border-border py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold tracking-widest text-amber-400 uppercase">
              Monthly Draws
            </p>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              Three Ways to Win
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Every month, we draw 5 numbers. The more your scores match, the
              bigger your prize. If nobody matches all 5, the jackpot rolls
              over!
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                match: "5-Number Match",
                share: "40%",
                rollover: true,
                icon: "🏆",
                accent: "from-amber-400 to-yellow-300",
              },
              {
                match: "4-Number Match",
                share: "35%",
                rollover: false,
                icon: "🥈",
                accent: "from-gray-300 to-gray-400",
              },
              {
                match: "3-Number Match",
                share: "25%",
                rollover: false,
                icon: "🥉",
                accent: "from-amber-600 to-amber-700",
              },
            ].map((tier) => (
              <div
                key={tier.match}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center transition-all duration-300 hover:border-amber-500/30 hover:bg-muted/50"
              >
                <div className="mb-4 text-4xl">{tier.icon}</div>
                <h3 className="mb-2 text-lg font-bold">{tier.match}</h3>
                <p
                  className={`mb-4 bg-gradient-to-r ${tier.accent} bg-clip-text text-4xl font-extrabold text-transparent`}
                >
                  {tier.share}
                </p>
                <p className="text-sm text-muted-foreground">
                  of the prize pool
                </p>
                {tier.rollover && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                    <TrendingUp className="h-3 w-3" />
                    Jackpot rollover if unclaimed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity Section */}
      <section id="charities" className="border-t border-border py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold tracking-widest text-rose-400 uppercase">
              Your Impact
            </p>
            <h2 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Every Round Gives Back
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
              A minimum of 10% of every subscription goes directly to a charity
              of your choice. Choose from our curated directory, or increase
              your contribution — it&apos;s up to you.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Choose Your Cause</h3>
                <p className="text-sm text-muted-foreground">
                  Browse our charity directory and pick the cause closest to
                  your heart. Change anytime.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Track Your Impact</h3>
                <p className="text-sm text-muted-foreground">
                  See exactly how much has been donated to your charity. Every
                  round you play makes a difference.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Spotlight Charities</h3>
                <p className="text-sm text-muted-foreground">
                  We feature charities on our homepage. Discover golf days,
                  events, and opportunities to get involved.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Independent Donations</h3>
                <p className="text-sm text-muted-foreground">
                  Want to give more? Make standalone donations to any listed
                  charity, anytime — no subscription needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/[0.04] py-24 lg:py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Ready to Tee Off?
            </h2>
            <p className="mb-10 text-lg text-muted-foreground">
              Join hundreds of golfers who play, win, and make a real
              difference. Your next round could change lives.
            </p>
            {session ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="group h-14 rounded-full bg-emerald-600 px-10 text-lg font-semibold text-white shadow-2xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <AuthModal>
                <Button
                  size="lg"
                  className="group h-14 rounded-full bg-emerald-600 px-10 text-lg font-semibold text-white shadow-2xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30"
                >
                  Subscribe Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </AuthModal>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            <span className="font-bold">
              Birdie<span className="text-emerald-400">Fund</span>
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} BirdieFund. Play responsibly. Give
            generously.
          </p>
        </div>
      </footer>
    </div>
  )
}
