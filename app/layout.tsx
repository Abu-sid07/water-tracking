import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ConvexClientProvider } from "@/lib/convex"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"

export const metadata: Metadata = {
  title: "Hydration Tracker",
  description: "Stay hydrated with smart water tracking and reminders",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {
          // Render font CSS via innerHTML and suppress hydration warning to avoid
          // server/client text-content encoding differences (quotes vs entities).
        }
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `html { font-family: ${GeistSans.style.fontFamily}; --font-sans: ${GeistSans.variable}; --font-mono: ${GeistMono.variable}; }`,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ConvexClientProvider>
            <AuthProvider>{children}</AuthProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
