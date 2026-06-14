"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { Eye, EyeOff, ArrowRight, Star, BookOpen, Users, Award } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

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
    <div className="min-h-screen flex">
      {/* ─── Left Panel: Brand ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image src="/main-logo.jpeg" alt="English With Evelina" width={44} height={44} className="rounded-full object-cover ring-2 ring-white/30" />
          <span className="text-white font-bold text-xl">English With Evelina</span>
        </div>

        {/* Testimonial */}
        <div className="relative">
          <div className="text-5xl mb-6">📚</div>
          <blockquote className="text-white text-2xl font-bold leading-snug mb-6">
            "Žingsnis po žingsnio — ir anglų kalba taps jūsų. Pradėkite šiandien."
          </blockquote>
          <p className="text-indigo-200 font-medium">— Evelina, anglų kalbos mokytoja</p>

          {/* Mini stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Users, value: "200+", label: "Mokiniai" },
              { icon: Star, value: "5.0", label: "Įvertinimas" },
              { icon: Award, value: "5+", label: "Metai" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                <stat.icon className="h-5 w-5 text-white/70 mx-auto mb-1" />
                <div className="text-white font-bold text-lg">{stat.value}</div>
                <div className="text-indigo-200 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative">
          <p className="text-indigo-200 text-sm">
            ✨ Nemokamas pirmasis pokalbis &nbsp;•&nbsp; Individuali programa
          </p>
        </div>
      </div>

      {/* ─── Right Panel: Form ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Image src="/main-logo.jpeg" alt="English With Evelina" width={40} height={40} className="rounded-full object-cover" />
            <span className="font-bold text-gray-900 text-lg">English With Evelina</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sveiki sugrįžę! 👋</h1>
            <p className="text-gray-500">Prisijunkite prie savo paskyros ir tęskite mokymąsi</p>
          </div>

          <Card className="card-elevated overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 rounded-xl">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">El. paštas</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jusu@email.lt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Slaptažodis</Label>
                    <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium">
                      Pamiršote slaptažodį?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Įveskite slaptažodį"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Jungiamasi...
                    </>
                  ) : (
                    <>
                      Prisijungti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                  Neturite paskyros?{" "}
                  <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
                    Registruotis
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-400 mt-6">
            Prisijungdami sutinkate su mūsų{" "}
            <Link href="/terms" className="text-indigo-600 hover:underline">Naudojimo sąlygomis</Link>
            {" "}ir{" "}
            <Link href="/privacy" className="text-indigo-600 hover:underline">Privatumo politika</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
