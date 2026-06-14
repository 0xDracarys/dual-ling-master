"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.classList.add("dark")
      setIsDark(true)
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-all duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600 transition-all duration-300" />
      )}
    </button>
  )
}
