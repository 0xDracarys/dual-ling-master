"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { ArrowRight } from "lucide-react"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getDashboardLink = () => {
    if (!user) return "/dashboard"

    switch (user.role) {
      case "admin":
        return "/admin/dashboard"
      case "teacher":
        return "/teacher/dashboard"
      default:
        return "/dashboard"
    }
  }

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <Image src="/main-logo.jpeg" alt="English With Evelina" width={40} height={40} className="rounded-full object-cover" />
          <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline-block">
            English With Evelina
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/courses" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
            {t.nav.courses}
          </Link>
          <Link href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
            {t.nav.pricing}
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
            {t.nav.about}
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
            {t.nav.contact}
          </Link>
          {user && (
            <Link href={getDashboardLink()} className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              {t.nav.dashboard}
            </Link>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          <LanguageToggle />
          
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="w-[200px] truncate text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-600 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer text-gray-900 hover:text-gray-900 hover:bg-gray-100">
                      <span className="mr-2">👤</span>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer text-gray-900 hover:text-gray-900 hover:bg-gray-100">
                      <span className="mr-2">⚙️</span>
                      {t.nav.settings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-gray-900 hover:text-gray-900 hover:bg-gray-100">
                    <span className="mr-2">🚪</span>
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button asChild variant="ghost" className="hover:bg-indigo-100 hover:text-indigo-700 hidden sm:flex">
                <Link href="/auth/login">{t.nav.signIn}</Link>
              </Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link href="/auth/register">
                  {t.nav.getStarted}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
