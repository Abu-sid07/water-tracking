"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { useMutation } from "convex/react"
import { api } from "../convex/_generated/api"

export interface User {
  id: string
  name: string
  email: string
  createdAt: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialUser = null }: { children: ReactNode; initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)
  // Convex mutations/queries
  const createConvexUser = useMutation(api.users.createUser)
  const authenticateUser = useMutation(api.users.authenticate)
  // Check for existing session on mount
  useEffect(() => {
    const syncUser = async (u: User) => {
      try {
        // Try to sync with Convex
        const convexUser = await createConvexUser({ 
          name: u.name, 
          email: u.email 
        })
        if (convexUser) {
          const updatedUser = { ...u, convexId: convexUser }
          setUser(updatedUser)
          localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        }
      } catch (e) {
        console.warn("Failed to sync WorkOS user with Convex:", e)
      }
    }

    if (initialUser) {
      // Check if we already have this user in localStorage with a convexId
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          if (parsed.email === initialUser.email && parsed.convexId) {
            setUser(parsed)
            setIsLoading(false)
            return
          }
        } catch (e) {
          // ignore
        }
      }

      setUser(initialUser)
      setIsLoading(false)
      // Sync in background
      syncUser(initialUser)
      return
    }

    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Failed to parse saved user:", error)
        localStorage.removeItem("currentUser")
      }
    }
    setIsLoading(false)
  }, [initialUser, createConvexUser])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      // Attempt server-side authentication via Convex
      try {
        const resp: any = await authenticateUser({ email, password })
        if (resp && resp.success) {
          const userRecord = resp.user
          const userSession: any = {
            id: userRecord._id || `user_${Date.now()}`,
            name: userRecord.name,
            email: userRecord.email,
            createdAt: userRecord.createdAt || Date.now(),
          }
          // Attach convex id
          userSession.convexId = resp.userId || userRecord._id

          setUser(userSession)
          localStorage.setItem("currentUser", JSON.stringify(userSession))
          setIsLoading(false)
          return { success: true }
        }
      } catch (e) {
        // Fall back to localStorage-based auth if Convex call fails
        console.warn("Convex authenticate failed, falling back to localStorage auth:", e)
      }

      // Fallback: localStorage check (legacy)
      const storedUsers = localStorage.getItem("registeredUsers")
      const users: Array<{ id: string; name: string; email: string; password: string; createdAt: number }> = storedUsers
        ? JSON.parse(storedUsers)
        : []

      const foundUser = users.find((u) => u.email === email && u.password === password)
      if (foundUser) {
        const userSession: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          createdAt: foundUser.createdAt,
        }
        setUser(userSession)
        localStorage.setItem("currentUser", JSON.stringify(userSession))
        setIsLoading(false)
        return { success: true }
      }

      setIsLoading(false)
      return { success: false, error: "Invalid email or password" }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: "Login failed. Please try again." }
    }
  }

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      // Get existing users
      const storedUsers = localStorage.getItem("registeredUsers")
      const users: Array<{ id: string; name: string; email: string; password: string; createdAt: number }> = storedUsers
        ? JSON.parse(storedUsers)
        : []

      // Check if user already exists
      if (users.some((u) => u.email === email)) {
        setIsLoading(false)
        return { success: false, error: "An account with this email already exists" }
      }

      // Create new user
      const newUser: any = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name,
        email,
        password,
        createdAt: Date.now(),
      }

      // Attempt to create a Convex user record and store the convexId on the registered user (store password)
      try {
        if (createConvexUser) {
          const convexId = await createConvexUser({ name, email, password })
          newUser.convexId = convexId
        }
      } catch (e) {
        console.warn("Failed to create convex user on signup:", e)
      }

      // Save to registered users
      users.push(newUser)
      localStorage.setItem("registeredUsers", JSON.stringify(users))

      // Auto-login the new user
      const userSession: any = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      }

      if (newUser.convexId) userSession.convexId = newUser.convexId

      setUser(userSession)
      localStorage.setItem("currentUser", JSON.stringify(userSession))
      setIsLoading(false)
      return { success: true }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: "Signup failed. Please try again." }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
    // Redirect to WorkOS logout
    window.location.href = "/api/auth/logout"
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAppAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAppAuth must be used within an AuthProvider")
  }
  return context
}
