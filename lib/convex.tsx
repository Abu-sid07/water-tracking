"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import type { ReactNode } from "react"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convexClient) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[convex] NEXT_PUBLIC_CONVEX_URL not set. Rendering without ConvexProvider. Run `convex dev` and set NEXT_PUBLIC_CONVEX_URL, or configure production URL.",
      )
    }
    return <>{children}</>
  }
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
}
