"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

interface DecodedTokenPayload {
  exp?: number
}

const decodeJwtPayload = (token: string | null): DecodedTokenPayload | null => {
  if (!token) return null

  try {
    if (typeof window === "undefined") return null

    const payload = token.split(".")[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = window.atob(base64)
    const jsonPayload = decodeURIComponent(
      decoded
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    )
    return JSON.parse(jsonPayload) as DecodedTokenPayload
  } catch (error) {
    console.error("Failed to decode JWT payload", error)
    return null
  }
}

interface User {
  id: string
  username: string
  email: string
  role: "student" | "teacher" | "admin"
}

interface AuthContextType {
  user: User | null
  token: string | null
  refreshToken: string | null
  login: (token: string, user: User, refreshToken: string, tokenExpiresAt?: number | null) => void
  logout: () => void
  refreshAuthToken: (options?: { force?: boolean }) => Promise<string | null>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const noopLogin: AuthContextType["login"] = () => {
  // no-op until mounted
}

const noopLogout: AuthContextType["logout"] = () => {
  // no-op until mounted
}

const noopRefresh: AuthContextType["refreshAuthToken"] = async () => null

// Updated to use Tier 1 Gemini API key for higher rate limits
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    // Check for stored auth data on mount
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")
    const storedRefreshToken = localStorage.getItem("auth_refresh_token")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      }
    }

    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken)
    }

    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setRefreshToken(null)

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")
      localStorage.removeItem("auth_refresh_token")
      localStorage.removeItem("auth_token_expires_at")
    }
  }, [])

  const login = useCallback(
    (newToken: string, newUser: User, newRefreshToken: string, tokenExpiresAt?: number | null) => {
      setToken(newToken)
      setUser(newUser)
      setRefreshToken(newRefreshToken)

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", newToken)
        localStorage.setItem("auth_user", JSON.stringify(newUser))
        localStorage.setItem("auth_refresh_token", newRefreshToken)

        if (tokenExpiresAt) {
          localStorage.setItem("auth_token_expires_at", tokenExpiresAt.toString())
        } else {
          localStorage.removeItem("auth_token_expires_at")
        }
      }
    },
    []
  )

  const refreshAuthToken = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (typeof window === "undefined") {
        return null
      }

      const activeToken = token ?? localStorage.getItem("auth_token")

      if (!options.force && activeToken) {
        const payload = decodeJwtPayload(activeToken)
        if (payload?.exp) {
          const msUntilExpiry = payload.exp * 1000 - Date.now()
          if (msUntilExpiry > 5 * 60 * 1000) {
            return activeToken
          }
        }
      }

      const activeRefreshToken = refreshToken ?? localStorage.getItem("auth_refresh_token")
      if (!activeRefreshToken) {
        return null
      }

      try {
        const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: activeRefreshToken,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          const errorMessage: string = data?.error?.message || "Token refresh failed"

          if (["TOKEN_EXPIRED", "USER_DISABLED", "INVALID_REFRESH_TOKEN"].includes(errorMessage)) {
            logout()
          }

          throw new Error(errorMessage)
        }

        const newIdToken = data.id_token as string | undefined
        const newRefreshToken = data.refresh_token as string | undefined
        const expiresInSeconds = data.expires_in ? Number.parseInt(data.expires_in, 10) : null

        if (!newIdToken || !newRefreshToken) {
          throw new Error("Token refresh response missing required fields")
        }

        setToken(newIdToken)
        setRefreshToken(newRefreshToken)

        localStorage.setItem("auth_token", newIdToken)
        localStorage.setItem("auth_refresh_token", newRefreshToken)

        if (expiresInSeconds) {
          const expiresAt = Date.now() + expiresInSeconds * 1000
          localStorage.setItem("auth_token_expires_at", expiresAt.toString())
        } else {
          localStorage.removeItem("auth_token_expires_at")
        }

        return newIdToken
      } catch (error) {
        console.error("Token refresh failed:", error)
        return null
      }
    },
    [token, refreshToken, logout]
  )

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") {
      return
    }

    if (!token) {
      return
    }

    const payload = decodeJwtPayload(token)

    if (!payload?.exp) {
      return
    }

    const msUntilExpiry = payload.exp * 1000 - Date.now()

    if (msUntilExpiry <= 0) {
      void refreshAuthToken({ force: true })
      return
    }

    const refreshDelay = Math.max(msUntilExpiry - 5 * 60 * 1000, 15 * 1000)

    const timeoutId = window.setTimeout(() => {
      void refreshAuthToken({ force: true })
    }, refreshDelay)

    return () => window.clearTimeout(timeoutId)
  }, [token, refreshAuthToken, isMounted])

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") {
      return
    }

    const handleFocus = () => {
      void refreshAuthToken()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAuthToken()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshAuthToken, isMounted])

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          refreshToken: null,
          login: noopLogin,
          logout: noopLogout,
          refreshAuthToken: noopRefresh,
          isLoading: true,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout,
        refreshAuthToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
