"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import type { ReactNode } from "react"

// Ensure we have a URL for the client, even if it's a dummy one for the build process.
// If NEXT_PUBLIC_CONVEX_URL is missing during build/runtime, we use a placeholder.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://build-placeholder.convex.cloud"

const convexClient = new ConvexReactClient(convexUrl)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Check if the URL is missing at runtime to warn the developer
  if (!process.env.NEXT_PUBLIC_CONVEX_URL && typeof window !== "undefined") {
    // Only warn once to avoid console spam, or just rely on standard logs
    // console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Real-time features will be disabled.")
  }

  // Always render the Provider. If the URL was missing, the client is configured with the placeholder,
  // which satisfies the context requirement for hooks like useMutation used in children.
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
}
