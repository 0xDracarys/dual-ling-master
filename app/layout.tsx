export const dynamic = 'force-dynamic';
import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/hooks/use-auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import "./globals.css"

export const metadata: Metadata = {
  title: "English With Evelina",
  description: "Anglų kalbos pamokos su Evelina — individuali, praktiškas ir palaikantis mokymasis suaugusiems.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className="font-sans bg-white text-gray-900">
        <AuthProvider>
          <AppNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
