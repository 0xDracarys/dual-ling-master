"use client"

import { useLanguage } from "@/hooks/use-language"

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <button
      id="lang-toggle-btn"
      onClick={() => setLanguage(language === 'en' ? 'lt' : 'en')}
      className="
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
        text-sm font-semibold
        bg-gradient-to-r from-indigo-500 to-purple-600
        text-white shadow-md
        hover:from-indigo-600 hover:to-purple-700
        hover:shadow-lg hover:scale-105
        active:scale-95
        transition-all duration-200 ease-in-out
        border border-white/20
        cursor-pointer select-none
      "
      aria-label={`Switch to ${language === 'en' ? 'Lithuanian' : 'English'}`}
      title={language === 'en' ? 'Switch to Lithuanian' : 'Switch to English'}
    >
      {t.langToggle}
    </button>
  )
}
