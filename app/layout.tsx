export const dynamic = 'force-dynamic';
import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/hooks/use-auth"
import { LanguageProvider } from "@/hooks/use-language"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "English With Evelina",
  description: "English lessons with Evelina — individual, practical and supportive learning for adults.",
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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <AppNavbar />
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
