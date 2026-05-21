import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ConvexClientProvider } from "@/lib/convex"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { withAuth } from '@workos-inc/authkit-nextjs'

export const metadata: Metadata = {
  title: "Hydration Tracker",
  description: "Stay hydrated with smart water tracking and reminders",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user: workosUser } = await withAuth()
  
  const initialUser = workosUser ? {
    id: workosUser.id,
    name: `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || 'User',
    email: workosUser.email,
    createdAt: Date.now(),
  } : null

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `html { font-family: ${GeistSans.style.fontFamily}; --font-sans: ${GeistSans.variable}; --font-mono: ${GeistMono.variable}; }`,
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <AuthProvider initialUser={initialUser}>
              {children}
            </AuthProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}