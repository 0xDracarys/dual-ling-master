import type React from "react"

import { AdminGate } from "@/components/admin/admin-gate"

// Every /admin page sits behind the AdminGate: admin role required,
// a fresh password confirmation (step-up), and idle auto sign-out.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminGate>{children}</AdminGate>
}
