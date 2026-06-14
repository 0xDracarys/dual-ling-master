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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowRight, CheckCircle, BookOpen, GraduationCap } from "lucide-react"

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Slaptažodžiai nesutampa")
      return
    }

    if (formData.password.length < 6) {
      setError("Slaptažodis turi būti bent 6 simbolių")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      router.push("/auth/login?message=Registracija sėkminga! Prisijunkite.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const benefits = [
    "Individuali mokymosi programa",
    "Pažangos sekimas ir ataskaitos",
    "Prieiga prie visų kursų",
    "Nemokamas pirmasis pokalbis",
  ]

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel: Brand ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image src="/main-logo.jpeg" alt="English With Evelina" width={44} height={44} className="rounded-full object-cover ring-2 ring-white/30" />
          <span className="text-white font-bold text-xl">English With Evelina</span>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-white text-3xl font-extrabold leading-snug mb-6">
            Pradėkite savo anglų kalbos kelionę šiandien!
          </h2>
          <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
            Prisijunkite prie 200+ mokinių, kurie jau mokosi drąsiai ir efektyviai.
          </p>

          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative">
          <p className="text-indigo-200 text-sm">
            ✨ Nemokamas 20 min. pokalbis jūsų laukia
          </p>
        </div>
      </div>

      {/* ─── Right Panel: Form ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <Image src="/main-logo.jpeg" alt="English With Evelina" width={40} height={40} className="rounded-full object-cover" />
            <span className="font-bold text-gray-900 text-lg">English With Evelina</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sukurti paskyrą 👋</h1>
            <p className="text-gray-500">Pradėkite savo anglų kalbos mokymosi kelionę</p>
          </div>

          <Card className="card-elevated overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 rounded-xl">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Name fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">Vardas</Label>
                    <Input
                      id="firstName"
                      placeholder="Jūsų vardas"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Pavardė</Label>
                    <Input
                      id="lastName"
                      placeholder="Pavardė"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Naudotojo vardas</Label>
                  <Input
                    id="username"
                    placeholder="Pasirinkite naudotojo vardą"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white rounded-xl"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">El. paštas</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jusu@email.lt"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white rounded-xl"
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Aš noriu</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-indigo-600" />
                          Mokytis anglų kalbos (Mokinys)
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-purple-600" />
                          Dėstyti kalbas (Mokytojas)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Slaptažodis</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sukurkite slaptažodį (min. 6 simboliai)"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white rounded-xl pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Pakartokite slaptažodį</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Pakartokite slaptažodį"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white rounded-xl pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Kuriama paskyra...
                    </>
                  ) : (
                    <>
                      Sukurti paskyrą
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-5 pt-5 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                  Jau turite paskyrą?{" "}
                  <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
                    Prisijungti
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-400 mt-4">
            Registruodamiesi sutinkate su{" "}
            <Link href="/terms" className="text-indigo-600 hover:underline">Naudojimo sąlygomis</Link>
            {" "}ir{" "}
            <Link href="/privacy" className="text-indigo-600 hover:underline">Privatumo politika</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
