"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HelpCircle, Search, BookOpen, MessageCircle, Phone, Mail, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { useLanguage } from "@/hooks/use-language"

const supportIcons = [MessageCircle, Mail, Phone]
const supportGradients = ["from-indigo-500 to-purple-600", "from-emerald-500 to-green-600", "from-pink-500 to-rose-600"]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { t } = useLanguage()
  const h = t.help

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const filteredCategories = h.categories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  const supportCards = [
    { title: h.liveChat, desc: h.liveChatDesc, btn: h.liveChatBtn },
    { title: h.emailSupport, desc: h.emailSupportDesc, btn: h.emailSupportBtn },
    { title: h.phoneSupport, desc: h.phoneSupportDesc, btn: h.phoneSupportBtn },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* ─── Hero ─── */}
      <section className="section-padding px-4">
        <div className="container-custom text-center">
          <div className="mb-8">
            <h1 className="heading-1 mb-6">
              {h.heroTitle} <span className="gradient-text">{h.heroTitleAccent}</span>
            </h1>
            <p className="body-large max-w-3xl mx-auto">{h.heroDesc}</p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={h.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick Actions ─── */}
      <section className="section-padding-sm px-4">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {supportCards.map((card, i) => {
              const Icon = supportIcons[i]
              const gradient = supportGradients[i]
              return (
                <Card key={i} className="card-interactive text-center group overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="heading-4 mb-2">{card.title}</CardTitle>
                    <CardDescription className="body-medium">{card.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button className={`w-full bg-gradient-to-r ${gradient} text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]`}>
                      {card.btn}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="section-padding-sm px-4 pt-0">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">{h.faqTitle}</h2>
            <p className="body-large text-gray-600">{h.faqDesc}</p>
          </div>

          <div className="space-y-8">
            {filteredCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="card-elevated overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <CardHeader>
                  <CardTitle className="heading-3 text-indigo-600">{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.questions.map((faq, questionIndex) => {
                    const itemId = `${categoryIndex}-${questionIndex}`
                    const isExpanded = expandedItems.has(itemId)
                    return (
                      <div key={questionIndex} className="border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors">
                        <button
                          onClick={() => toggleExpanded(itemId)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-indigo-50/50 transition-colors"
                        >
                          <span className="body-medium font-semibold text-gray-900">{faq.question}</span>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-6 pb-4">
                            <div className="w-full h-px bg-indigo-100 mb-4"></div>
                            <p className="body-medium text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Still Need Help ─── */}
      <section className="section-padding px-4 bg-white">
        <div className="container-custom text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="heading-2 mb-4">{h.stillNeedHelp}</h2>
            <p className="body-large mb-8">{h.stillNeedHelpDesc}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                {h.contactSupport}
                <MessageCircle className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" className="btn-outline-primary">
                {h.browseCourses}
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
