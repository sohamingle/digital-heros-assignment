import { Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "BirdieFund — Play. Win. Give Back.",
  description:
    "Enter your golf scores, compete in monthly prize draws, and support charities you care about. A modern platform combining performance tracking, rewards, and charitable giving.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <TooltipProvider>
          <ThemeProvider forcedTheme="light">
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
