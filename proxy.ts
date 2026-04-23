import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { pathname } = request.nextUrl

  // Protected dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const user = session.user as any

    // Admin-only routes
    if (pathname.startsWith("/dashboard/admin")) {
      if (user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } else {
      if (user.role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
