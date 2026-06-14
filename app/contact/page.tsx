"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Clock, MessageCircle, ArrowRight, Sparkles, Star, MapPin, Target, BarChart, ClipboardList } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

const methodIcons = [Mail, MessageCircle, Clock, MapPin]
const methodGradients = ["from-indigo-500 to-blue-500", "from-green-500 to-emerald-500", "from-violet-500 to-purple-500", "from-pink-500 to-rose-500"]
const methodActions = ["mailto:evelina@englishwithevelina.lt", "https://wa.me/37067510789", null, null]
const expectIcons = [Target, BarChart, ClipboardList]

export default function ContactPage() {
  const { t } = useLanguage()
  const c = t.contact

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* ─── Hero Section ─── */}
      <section className="relative py-16 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full"></div>
        </div>
        <div className="container-custom relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              {c.badge}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              {c.heading}{" "}
              <span className="text-indigo-200">{c.headingHighlight}</span>
            </h1>
            <p className="text-lg text-indigo-100">{c.intro}</p>
          </div>
        </div>
      </section>

      {/* ─── Contact Methods ─── */}
      <section className="section-padding-sm px-4">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {c.methods.map((info, index) => {
              const Icon = methodIcons[index]
              const gradient = methodGradients[index]
              const action = methodActions[index]
              return (
                <Card key={index} className="card-interactive text-center group overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
                  <CardHeader className="pb-3 pt-6">
                    <div className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">{info.title}</CardTitle>
                    <CardDescription className="text-sm">{info.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-6">
                    {action ? (
                      <a href={action} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm break-all hover:underline">
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-line text-sm font-medium">{info.value}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Main 2-col Content ─── */}
      <section className="section-padding-sm px-4 pt-0">
        <div className="container-custom max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* LEFT: Contact Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{c.formTitle}</h2>
                <p className="text-gray-600">{c.formDesc}</p>
              </div>

              <Card className="card-elevated overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <CardContent className="p-0">
                  <iframe src="https://whatsform.com/2lk-GU" width="100%" height="600" frameBorder="0" className="w-full"></iframe>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: What to expect + Quote */}
            <div className="flex flex-col gap-8">
              {/* What to expect */}
              <Card className="card-elevated overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-pink-500"></div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{c.expectTitle}</h3>
                  <p className="text-gray-500 mb-6 text-sm">{c.expectDesc}</p>
                  <div className="space-y-5">
                    {c.expectItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                          {(() => {
                            const Icon = expectIcons[i];
                            return <Icon className="h-6 w-6 stroke-[2]" />;
                          })()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" asChild>
                      <a href="https://wa.me/37067510789" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-5 w-5" />
                        {c.btnWhatsApp}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Teacher quote card */}
              <Card className="card-elevated overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-300 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg font-medium leading-relaxed mb-6 opacity-95">
                    {c.quote}
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">E</div>
                    <div>
                      <p className="font-bold">Evelina</p>
                      <p className="text-sm text-indigo-200">{c.quoteAuthor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response time badge */}
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                <p className="text-sm text-gray-600">{c.responseTime}</p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
