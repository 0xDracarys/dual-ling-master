"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, MessageCircle, ArrowRight, Calendar, Users, BookOpen, Zap, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/hooks/use-language"

const planIcons = [BookOpen, Zap, Users]
const planGradients = ["from-blue-500 to-cyan-500", "from-indigo-600 to-purple-600", "from-purple-600 to-pink-600"]
const planGlows = ["shadow-blue-200", "shadow-indigo-300", "shadow-purple-200"]
const popularIndex = 1

const testimonials = [
  { name: "Rasa K.", role: "Manager, Vilnius", content: "Thanks to Evelina's lessons I can confidently communicate with foreign partners. The method is very practical and clear.", rating: 5, initials: "RK" },
  { name: "Tomas M.", role: "IT specialist", content: "After 3 months of lessons with Evelina I'm receiving job offers from international companies. Highly recommend!", rating: 5, initials: "TM" },
  { name: "Gintarė P.", role: "Student", content: "I was afraid to speak English, now I feel confident. Evelina creates an environment where you're not afraid to make mistakes.", rating: 5, initials: "GP" },
]

const pricingFaqs = [
  { question: "How are lessons conducted?", answer: "Lessons are held remotely via Zoom or Google Meet. All you need is a computer and internet connection. No special software — just click the link." },
  { question: "What level is suitable?", answer: "I work with A1–C1 levels. Before starting we do a free diagnostic call to determine your level and needs." },
  { question: "Can I cancel or reschedule?", answer: "Yes — you can reschedule or cancel up to 24 hours before the lesson with no extra charge. Late cancellations are counted as a lesson." },
  { question: "Is a trial session available?", answer: "Yes! I offer a free 20 min. introductory call to discuss your goals and the learning process." },
  { question: "How is payment handled?", answer: "Payment via bank transfer or PayPal. Monthly package is paid at the start of the month. Single lessons are paid before each lesson." },
  { question: "How long to see progress?", answer: "Most students notice clear improvement after 1–2 months of consistent lessons." },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { t } = useLanguage()
  const p = t.pricing

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* ─── Hero ─── */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full"></div>
        </div>
        <div className="container-custom text-center relative">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6 gap-2">
            <Calendar className="h-4 w-4" />
            {p.heroBadge}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {p.heroTitle}
            <span className="block text-indigo-200 mt-1">{p.heroTitleAccent}</span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-4">{p.heroDesc}</p>
          <p className="text-sm text-indigo-200">{p.heroBadge2}</p>
        </div>
      </section>

      {/* ─── Pricing Cards ─── */}
      <section className="py-20 px-4 -mt-8">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {p.plans.map((plan, idx) => (
              <Card
                key={idx}
                className={`relative flex flex-col transition-all duration-300 hover:-translate-y-2 overflow-hidden ${
                  idx === popularIndex
                    ? `ring-2 ring-indigo-500 shadow-2xl ${planGlows[idx]} scale-[1.02]`
                    : `shadow-xl hover:shadow-2xl`
                }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${planGradients[idx]}`}></div>

                {idx === popularIndex && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-1.5 text-sm shadow-lg font-semibold">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {p.popular}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8">
                  <div className={`w-16 h-16 bg-gradient-to-r ${planGradients[idx]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    {(() => { const Icon = planIcons[idx]; return <Icon className="w-8 h-8 text-white" /> })()}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <p className="text-sm text-indigo-600 font-semibold">{plan.subtitle}</p>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  <div className="mt-5 pb-2">
                    <span className="text-5xl font-black text-gray-900">€{plan.price}</span>
                    <span className="text-gray-500 ml-1 text-lg">/{plan.per}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 px-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 bg-gradient-to-r ${planGradients[idx]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    {plan.missing.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 opacity-40">
                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-gray-500 text-sm leading-relaxed line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6 pb-8 px-6">
                  <Link href="/contact" className="w-full">
                    <Button
                      className={`w-full py-6 text-base font-semibold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-xl ${
                        idx === popularIndex
                          ? `bg-gradient-to-r ${planGradients[idx]} hover:opacity-90 text-white`
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section className="py-12 px-4">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{p.tableTitle}</h2>
          <Card className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 text-gray-500 font-medium text-sm w-1/2">{p.tableFeature}</th>
                    <th className="text-center p-4 text-gray-900 font-bold text-sm">{p.tableSingle}</th>
                    <th className="text-center p-4 text-indigo-600 font-bold text-sm bg-indigo-50">{p.tableMonthly}</th>
                    <th className="text-center p-4 text-gray-900 font-bold text-sm">{p.tableIntensive}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.comparison.map((feature, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                      <td className="p-4 text-sm text-gray-700">{feature}</td>
                      {[i === 0, true, true].map((has, j) => (
                        <td key={j} className={`text-center p-4 ${j === 1 ? 'bg-indigo-50/50' : ''}`}>
                          {has ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Free intro call banner ─── */}
      <section className="py-12 px-4">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-90 relative" />
            <h2 className="text-2xl font-bold mb-3 relative">{p.bannerTitle}</h2>
            <p className="text-indigo-100 mb-6 text-lg relative">{p.bannerDesc}</p>
            <Link href="/contact" className="relative">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100 font-semibold px-8 py-4 text-base transition-all hover:scale-105 shadow-lg">
                {p.bannerCta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 px-4">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">{p.testimonialsTitle}</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-xl mx-auto">{p.testimonialsSubtitle}</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((item, i) => (
              <Card key={i} className="card-elevated hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(item.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-5 italic leading-relaxed text-sm">"{item.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{item.initials}</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Accordion FAQ ─── */}
      <section className="py-20 px-4 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">{p.faqTitle}</h2>
          <div className="space-y-3">
            {pricingFaqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === i ? 'border-indigo-200 shadow-lg' : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'}`}>
                <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className={`font-semibold text-base ${openFaq === i ? 'text-indigo-600' : 'text-gray-900'}`}>{faq.question}</span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openFaq === i ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {openFaq === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <div className="w-full h-px bg-indigo-100 mb-4"></div>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container-custom text-center relative">
          <h2 className="text-4xl font-bold mb-6">{p.ctaTitle}</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">{p.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100 text-lg px-8 py-6 font-semibold hover:scale-105 transition-all shadow-xl">
                {p.ctaBtnContact}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/20 font-semibold">
                {p.ctaBtnCourses}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
