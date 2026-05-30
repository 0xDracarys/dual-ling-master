"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Save authentication state to localStorage via useAuth hook
      if (!data.refreshToken) {
        throw new Error("Login response missing refresh token")
      }

      login(
        data.token,
        {
          id: data.user.uid,
          username: data.user.name || data.user.email.split("@")[0],
          email: data.user.email,
          role: data.user.role,
        },
        data.refreshToken,
        data.tokenExpiresAt || null
      )

      // Redirect based on user role
      switch (data.user.role) {
        case "admin":
          router.push("/admin/dashboard")
          break
        case "teacher":
          router.push("/teacher/dashboard")
          break
        default:
          router.push("/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <h1 className="heading-1 mb-4">Welcome Back</h1>
          <p className="body-large">Sign in to your account to continue learning</p>
        </div>

        <Card className="card-elevated">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="body-medium font-medium text-gray-700">Email</Label>
                                         <Input
                           id="email"
                           type="email"
                           placeholder="Enter your email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                           className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                         />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="body-medium font-medium text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              </div>

              <Button type="submit" className="w-full h-12 btn-primary" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="body-medium text-gray-600">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
