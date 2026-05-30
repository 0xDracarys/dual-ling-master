"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    role: "student",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim() || formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Registration failed")
      }

      router.push("/auth/login?message=Registration successful! Please sign in.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
          <h1 className="heading-1 mb-4">Join LangExchange</h1>
          <p className="body-large">Start your language learning journey today</p>
        </div>

        <Card className="card-elevated">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="body-medium font-medium text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="body-medium font-medium text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="body-medium font-medium text-gray-700">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="body-medium font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="body-medium font-medium text-gray-700">I want to</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Learn languages (Student)</SelectItem>
                    <SelectItem value="teacher">Teach languages (Teacher)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="body-medium font-medium text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="body-medium font-medium text-gray-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 btn-primary" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="body-medium text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
