"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Shield, GraduationCap, BookOpen, User, Copy, Check,
  ArrowRight, Lock, Eye, EyeOff, Layers, Users, BarChart2,
  BookMarked, ClipboardList, Star, TrendingUp, Zap, ChevronDown, ChevronUp
} from "lucide-react"

const DEMO_ACCOUNTS = [
  {
    role: "Super Admin",
    email: "super.admin@dualliing.com",
    password: "Demo@2025!",
    dashboard: "/admin/dashboard",
    icon: Shield,
    gradient: "from-red-500 to-rose-600",
    bgLight: "bg-red-50",
    textColor: "text-red-700",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    capabilities: [
      "Full platform access & control",
      "Manage all users (create/delete/role change)",
      "Manage all courses (approve/reject/delete)",
      "View platform analytics & revenue",
      "Configure system settings",
      "Firebase Admin capabilities",
    ],
  },
  {
    role: "Admin",
    email: "admin@dualliing.com",
    password: "Demo@2025!",
    dashboard: "/admin/dashboard",
    icon: Shield,
    gradient: "from-orange-500 to-amber-600",
    bgLight: "bg-orange-50",
    textColor: "text-orange-700",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    capabilities: [
      "Manage users and roles",
      "View course enrollments",
      "Platform analytics dashboard",
      "Manage course approvals",
      "Access admin settings",
    ],
  },
  {
    role: "Teacher",
    email: "teacher@dualliing.com",
    password: "Demo@2025!",
    dashboard: "/teacher/dashboard",
    icon: GraduationCap,
    gradient: "from-indigo-500 to-purple-600",
    bgLight: "bg-indigo-50",
    textColor: "text-indigo-700",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
    capabilities: [
      "Create and manage courses",
      "Add lessons (video, quiz, reading, exercises)",
      "Upload PDF/document resources",
      "View enrolled students & progress",
      "AI-assisted course creation",
      "Track student performance",
    ],
  },
  {
    role: "Student",
    email: "student@dualliing.com",
    password: "Demo@2025!",
    dashboard: "/dashboard",
    icon: BookOpen,
    gradient: "from-green-500 to-emerald-600",
    bgLight: "bg-green-50",
    textColor: "text-green-700",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    capabilities: [
      "Browse and enroll in courses",
      "Complete lessons and quizzes",
      "Track personal progress",
      "View certificates on completion",
      "Access learning dashboard",
      "See XP and achievement stats",
    ],
  },
]

const PLATFORM_FLOW = [
  {
    step: "01",
    icon: Users,
    title: "User Registration",
    description: "Users sign up as Student or Teacher. Admins are created by Super Admins via the Admin Panel.",
    color: "from-blue-500 to-cyan-500",
    details: [
      "Firebase Authentication (email + password)",
      "Role stored in Firestore users collection + Firebase custom claims",
      "JWT token issued and stored in localStorage for session",
    ],
  },
  {
    step: "02",
    icon: GraduationCap,
    title: "Course Creation (Teacher)",
    description: "Teachers create structured courses with multiple lesson types.",
    color: "from-purple-500 to-indigo-500",
    details: [
      "Teacher fills: title, description, language, level, estimated hours",
      "Adds lessons: Video / Reading / Quiz / Exercise",
      "Attaches PDF/document resources per lesson",
      "Publishes course → visible to students in /courses",
    ],
  },
  {
    step: "03",
    icon: BookMarked,
    title: "Student Enrollment",
    description: "Students browse, enroll, and access courses instantly.",
    color: "from-green-500 to-emerald-500",
    details: [
      "Student clicks 'Enroll' on any published course",
      "Enrollment record created in Firestore with progress=0%",
      "Student dashboard shows enrolled courses & completion status",
    ],
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Every lesson completion updates the student's progress in real-time.",
    color: "from-orange-500 to-red-500",
    details: [
      "Each lesson has a completion status (not_started → in_progress → completed)",
      "Quiz scores tracked per attempt, best score stored",
      "Time spent per lesson recorded",
      "Enrollment progress% auto-recalculated after each lesson",
      "Teacher can see student-level breakdown in /teacher/students",
    ],
  },
  {
    step: "05",
    icon: BarChart2,
    title: "Admin Analytics",
    description: "Admins see platform-wide statistics and manage all entities.",
    color: "from-pink-500 to-rose-500",
    details: [
      "Total users, teachers, students, courses",
      "Published vs draft courses",
      "Enrollment stats per course",
      "User activity and last login",
    ],
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/40 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  )
}

function AccountCard({ account }: { account: typeof DEMO_ACCOUNTS[0] }) {
  const [showPass, setShowPass] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const Icon = account.icon

  return (
    <div className={`rounded-2xl border ${account.border} bg-white shadow-lg hover:shadow-xl transition-all duration-300`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${account.gradient} p-5 rounded-t-2xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">{account.role}</span>
            </div>
          </div>
          <Link
            href={account.dashboard}
            className="flex items-center gap-1 text-white/90 text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
          >
            Dashboard <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Credentials */}
      <div className="p-5 space-y-3">
        {/* Email */}
        <div className={`flex items-center justify-between ${account.bgLight} rounded-lg px-3 py-2`}>
          <div>
            <div className="text-xs text-gray-500 font-medium">Email</div>
            <div className={`text-sm font-semibold ${account.textColor}`}>{account.email}</div>
          </div>
          <CopyButton text={account.email} />
        </div>

        {/* Password */}
        <div className={`flex items-center justify-between ${account.bgLight} rounded-lg px-3 py-2`}>
          <div className="flex-1">
            <div className="text-xs text-gray-500 font-medium">Password</div>
            <div className={`text-sm font-semibold ${account.textColor} font-mono`}>
              {showPass ? account.password : "••••••••••"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowPass(!showPass)} className="p-1 rounded hover:bg-white/40 transition-colors">
              {showPass ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            <CopyButton text={account.password} />
          </div>
        </div>

        {/* Capabilities toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between text-xs font-semibold ${account.textColor} pt-1 hover:opacity-80 transition-opacity`}
        >
          <span>Capabilities</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <ul className="space-y-1.5 pt-1 border-t border-gray-100">
            {account.capabilities.map((cap, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${account.textColor}`} />
                {cap}
              </li>
            ))}
          </ul>
        )}

        {/* Login Button */}
        <Link
          href="/auth/login"
          className={`mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r ${account.gradient} text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all`}
        >
          <Lock className="h-3.5 w-3.5" />
          Sign in as {account.role}
        </Link>
      </div>
    </div>
  )
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600 rounded-full opacity-20 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white/10">
            <Zap className="h-4 w-4 text-yellow-400" />
            Demo Mode — All accounts are pre-seeded
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
            Platform Demo Guide
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            English With Evelina — a full-stack language learning platform with role-based access, course management, and real-time progress tracking.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Firebase Auth", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
              { label: "Firestore DB", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
              { label: "Next.js 14", color: "bg-green-500/20 text-green-300 border-green-500/30" },
              { label: "Role-Based Access", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
              { label: "Real-time Progress", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
            ].map((tag) => (
              <span key={tag.label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${tag.color}`}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Accounts */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-3">🔑 Demo Accounts</h2>
        <p className="text-white/60 text-center mb-10">Click any account to copy credentials and sign in instantly.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {DEMO_ACCOUNTS.map((account) => (
            <AccountCard key={account.role} account={account} />
          ))}
        </div>

        {/* Quick credentials table */}
        <div className="mt-10 max-w-3xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="font-bold text-lg">Quick Reference</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-3 text-white/50 font-medium">Role</th>
                  <th className="text-left px-6 py-3 text-white/50 font-medium">Email</th>
                  <th className="text-left px-6 py-3 text-white/50 font-medium">Password</th>
                  <th className="text-left px-6 py-3 text-white/50 font-medium">Dashboard</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ACCOUNTS.map((acc, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 font-semibold text-white">{acc.role}</td>
                    <td className="px-6 py-3 text-indigo-300 font-mono text-xs">{acc.email}</td>
                    <td className="px-6 py-3 text-purple-300 font-mono text-xs">{acc.password}</td>
                    <td className="px-6 py-3">
                      <Link href={acc.dashboard} className="text-green-400 hover:underline text-xs">{acc.dashboard}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Platform Flow */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-3">⚙️ How the Platform Works</h2>
        <p className="text-white/60 text-center mb-10 max-w-2xl mx-auto">
          End-to-end flow from user registration to course completion — how courses are created, enrolled in, and tracked.
        </p>

        <div className="max-w-4xl mx-auto space-y-6">
          {PLATFORM_FLOW.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="flex gap-6 group">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {index < PLATFORM_FLOW.length - 1 && (
                    <div className="w-0.5 flex-1 bg-white/10 mt-3" />
                  )}
                </div>

                {/* Content */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-4 flex-1 hover:bg-white/8 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      STEP {item.step}
                    </span>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-4">{item.description}</p>
                  <ul className="space-y-2">
                    {item.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color} flex-shrink-0`} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-10">🔗 Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: "Home", href: "/", emoji: "🏠" },
            { label: "Courses", href: "/courses", emoji: "📚" },
            { label: "Register", href: "/auth/register", emoji: "✍️" },
            { label: "Login", href: "/auth/login", emoji: "🔐" },
            { label: "Admin Dashboard", href: "/admin/dashboard", emoji: "⚙️" },
            { label: "Admin Users", href: "/admin/users", emoji: "👥" },
            { label: "Admin Analytics", href: "/admin/analytics", emoji: "📊" },
            { label: "Teacher Dashboard", href: "/teacher/dashboard", emoji: "👩‍🏫" },
            { label: "Teacher Courses", href: "/teacher/courses", emoji: "📖" },
            { label: "Student Dashboard", href: "/dashboard", emoji: "🎓" },
            { label: "Profile", href: "/profile", emoji: "👤" },
            { label: "Pricing", href: "/pricing", emoji: "💰" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            >
              <span>{link.emoji}</span>
              <span className="text-white/80">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-white/30 text-sm border-t border-white/10">
        English With Evelina — Demo Environment · All data is test data
      </div>
    </div>
  )
}
