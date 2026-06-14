"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Target, Award, Heart, Zap, ArrowRight, CheckCircle, Star, TrendingUp, MessageCircle, Lightbulb, Globe, Sparkles } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/hooks/use-language"

const valueIcons = [Heart, Target, Users, Zap]
const pillarIcons = [MessageCircle, Lightbulb, Heart]
const statIcons = [Users, Award, TrendingUp, Star]
const statColors = ["text-indigo-600", "text-purple-600", "text-pink-600", "text-amber-600"]
const timelineIcons = ["🌱", "📚", "💻", "🏆", "🚀"]
const valueBgs = ["bg-pink-50", "bg-indigo-50", "bg-violet-50", "bg-amber-50"]
const valueGradients = ["from-pink-500 to-rose-500", "from-indigo-500 to-blue-500", "from-violet-500 to-purple-500", "from-amber-500 to-orange-500"]
const pillarGradients = ["from-indigo-500 to-blue-500", "from-violet-500 to-purple-500", "from-pink-500 to-rose-500"]

export default function AboutPage() {
  const { t } = useLanguage()
  const a = t.about

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">

      {/* ─── Hero Section ─── */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
        </div>

        <div className="container-custom relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="flex justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl blur-2xl opacity-20 transform -rotate-3"></div>
                <Image
                  src="/about-us-image.jpg"
                  alt="Evelina - anglų kalbos mokytoja"
                  width={450}
                  height={550}
                  className="relative rounded-3xl shadow-2xl object-cover w-full h-auto"
                  priority
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 whitespace-nowrap">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Patirtis</p>
                    <p className="font-bold text-gray-900">{a.experienceBadge}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {a.badge}
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
                {a.heading}
              </h1>

              <p className="text-lg text-gray-700 mb-4 leading-relaxed">{a.p1}</p>
              <p className="text-gray-600 mb-4 leading-relaxed">{a.p2}</p>
              <p className="text-gray-600 mb-6 leading-relaxed">{a.p3}</p>

              <ul className="space-y-2 mb-8">
                {a.bullets.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/courses">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    {a.btnCourses}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                    {a.btnContact}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Row ─── */}
      <section className="py-12 px-4 bg-white/80 backdrop-blur-sm border-y border-gray-100">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {a.statsLabels.map((label, i) => {
              const Icon = statIcons[i]
              return (
                <div key={i} className="group">
                  <Icon className={`h-6 w-6 ${statColors[i]} mx-auto mb-2 group-hover:scale-125 transition-transform`} />
                  <div className={`text-3xl font-black ${statColors[i]} mb-1`}>{a.stats[i].split(' ')[0]}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Teaching Method ─── */}
      <section className="py-20 px-4">
        <div className="container-custom">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{a.philosophyTitle}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{a.philosophySubtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {a.pillars.map((pillar, i) => {
              const Icon = pillarIcons[i]
              const gradient = pillarGradients[i]
              return (
                <Card key={i} className="card-elevated group hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                  <div className={`h-1.5 bg-gradient-to-r ${gradient}`}></div>
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{pillar.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{pillar.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── My Journey Timeline ─── */}
      <section className="py-20 px-4 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{a.journeyTitle}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{a.journeySubtitle}</p>
          </div>

          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 transform md:-translate-x-1/2"></div>

            <div className="space-y-10">
              {a.timeline.map((item, i) => (
                <div key={i} className={`relative flex items-start gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`md:w-5/12 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'} pl-16 md:pl-0`}>
                    <Card className="card-elevated hover:shadow-xl transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className={`flex items-center gap-2 mb-2 ${i % 2 === 0 ? 'md:justify-end' : ''}`}>
                          <span className="text-2xl">{timelineIcons[i]}</span>
                          <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{item.year}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full border-4 border-white shadow-md mt-6"></div>
                  <div className="hidden md:block md:w-5/12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container-custom">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{a.valuesTitle}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{a.valuesSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {a.values.map((value, i) => {
              const Icon = valueIcons[i]
              return (
                <div key={i} className={`flex items-start gap-5 p-6 rounded-2xl ${valueBgs[i]} hover:shadow-md transition-all duration-300 border border-white`}>
                  <div className={`w-14 h-14 bg-gradient-to-r ${valueGradients[i]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">{value.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full"></div>
        </div>
        <div className="container-custom text-center relative">
          <div className="text-5xl mb-4">🤝</div>
          <h2 className="text-4xl font-bold mb-6">{a.ctaTitle}</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">{a.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 font-semibold hover:scale-105 transition-all shadow-xl">
                {a.ctaBtnPricing}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/20 font-semibold">
                {a.ctaBtnContact}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
