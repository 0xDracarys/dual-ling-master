"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth"
import { ShieldCheck, Lock } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { auth } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Admin pages expose student personal data, so entering the admin area
// requires a fresh password confirmation ("step-up") and the session
// locks again after inactivity.
const STEP_UP_TTL_MS = 10 * 60 * 1000 // re-confirm password every 10 minutes
const IDLE_LIMIT_MS = 30 * 60 * 1000 // auto sign-out after 30 minutes idle
const STORAGE_KEY = "admin_stepup_at"

function maskEmail(email?: string): string {
  if (!email) return ""
  const at = email.indexOf("@")
  if (at < 1) return email
  return `${email.slice(0, 2)}•••${email.slice(at)}`
}

type GateState = "loading" | "signed-out" | "forbidden" | "locked" | "open"

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [verified, setVerified] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const isAdmin = user?.role === "admin"

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Check the step-up timestamp on mount and whenever the tab regains focus.
  React.useEffect(() => {
    if (!isAdmin) return
    const check = () => {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      const at = raw ? parseInt(raw, 10) : 0
      setVerified(Number.isFinite(at) && Date.now() - at < STEP_UP_TTL_MS)
    }
    check()
    window.addEventListener("focus", check)
    return () => window.removeEventListener("focus", check)
  }, [isAdmin])

  // Idle auto sign-out for admin sessions.
  React.useEffect(() => {
    if (!isAdmin) return
    let last = Date.now()
    const bump = () => {
      last = Date.now()
    }
    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    const timer = setInterval(() => {
      if (Date.now() - last > IDLE_LIMIT_MS) {
        sessionStorage.removeItem(STORAGE_KEY)
        logout()
        router.push("/auth/login")
      }
    }, 30_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump))
      clearInterval(timer)
    }
  }, [isAdmin, logout, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email || !password) return
    setBusy(true)
    setError(null)
    try {
      const credential = EmailAuthProvider.credential(user.email, password)
      if (auth.currentUser) {
        await reauthenticateWithCredential(auth.currentUser, credential)
      } else {
        await signInWithEmailAndPassword(auth, user.email, password)
      }
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
      setPassword("")
      setVerified(true)
    } catch {
      setError("Incorrect password. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  // Auth state loads from localStorage after mount; render the page as-is
  // until then so the server HTML and first client render always match.
  if (!mounted) {
    return <>{children}</>
  }

  const state: GateState = !user
    ? "signed-out"
    : !isAdmin
      ? "forbidden"
      : verified
        ? "open"
        : "locked"

  if (state === "open") {
    return <>{children}</>
  }

  // Non-open states fully replace the page with the gate. (Data protection
  // itself stays with the API and Firestore rules — admin data is only
  // fetched client-side with a valid admin token. The gate keeps the admin
  // UI, and its personal data, off the screen until the step-up passes.)
  if (state === "signed-out") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-gray-400" />
        <h1 className="mb-2 text-xl font-semibold">Sign in required</h1>
        <p className="mb-6 text-gray-600">
          The admin area is restricted. Please sign in with an admin account.
        </p>
        <Button onClick={() => router.push("/auth/login")}>Go to sign in</Button>
      </div>
    )
  }

  if (state === "forbidden") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-gray-400" />
        <h1 className="mb-2 text-xl font-semibold">Access restricted</h1>
        <p className="text-gray-600">
          This area is for administrators only. Your account does not have
          admin access.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <Card>
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-indigo-600" />
          <CardTitle>Confirm it&apos;s you</CardTitle>
          <CardDescription>
            The admin area contains student personal data. Re-enter the
            password for {maskEmail(user?.email)} to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-stepup-password">Password</Label>
              <Input
                id="admin-stepup-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Checking…" : "Unlock admin area"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
