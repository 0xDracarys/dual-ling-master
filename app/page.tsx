"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Award, Globe, ArrowRight, CheckCircle, Star, Play, Zap, Shield, Clock, Heart, Sparkles, Target, TrendingUp, Brain, Languages, Trophy, MessageCircle, Phone, Calendar, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/hooks/use-language"
import { motion } from "framer-motion"

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const { t } = useLanguage()

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = t.testimonials_people.map((p, i) => ({
    ...p,
    rating: 5,
    avatar: ["RK", "JP", "PR"][i],
    flag: "🇱🇹",
  }))

  const featureIcons = [Brain, MessageCircle, Award, Globe, Shield, Clock]

  const stepIcons = ["📞", "📋", "🚀"]
  const stepColors = ["from-blue-500 to-cyan-500", "from-violet-500 to-indigo-500", "from-pink-500 to-rose-500"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* ─── Hero Section ─── */}
      <section className="relative py-16 px-4">
        <div className="container-custom">
          <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div 
                className="text-left"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
              >
                <motion.div 
                  className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="h-4 w-4" />
                  {t.hero.badge}
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  {t.hero.greeting}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mt-1">
                    {t.hero.title}
                  </span>
                </h1>

                <p className="text-lg text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">
                  {t.hero.description}
                </p>

                <p className="text-base font-semibold text-gray-800 mb-2">{t.hero.findHere}</p>
                <ul className="space-y-2 mb-8 text-gray-700">
                  {[t.hero.bullet1, t.hero.bullet2, t.hero.bullet3].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-lg text-indigo-700 font-medium mb-8">
                  {t.hero.goal}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" variant="3d-green" className="text-lg px-8 py-6 w-full sm:w-auto">
                    <Link href="/auth/register">
                      {t.hero.cta}
                      <ArrowRight className="ml-2 h-5 w-5 animate-bounce-slight" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="3d-white" className="text-lg px-8 py-6 w-full sm:w-auto shadow-sm">
                    <Link href="/courses">
                      <Play className="mr-2 h-5 w-5" />
                      {t.hero.viewCourses}
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Hero Image */}
              <motion.div 
                className="flex justify-center lg:justify-end"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.5, delay: 0.2 }}
              >
                <div className="relative w-full max-w-md animate-float">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl blur-2xl opacity-20 transform rotate-3"></div>
                  <Image
                    src="/portfolio-hero-image.jpg"
                    alt="Evelina - English teacher"
                    width={500}
                    height={600}
                    className="relative rounded-3xl shadow-2xl object-cover w-full h-auto"
                    priority
                  />
                  {/* Floating badge */}
                  <motion.div 
                    className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border-b-4 border-gray-200"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-10 h-10 bg-[#58CC02] rounded-xl flex items-center justify-center border-b-2 border-[#46A302]">
                      <Trophy className="h-5 w-5 text-white animate-wiggle" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{t.stats_floating.students}</p>
                      <p className="text-lg font-bold text-gray-900">200+</p>
                    </div>
                  </motion.div>
                  {/* Floating badge 2 */}
                  <motion.div 
                    className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border-b-4 border-gray-200"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <div className="w-10 h-10 bg-[#FFC800] rounded-xl flex items-center justify-center border-b-2 border-[#E5B400]">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{t.stats_floating.rating}</p>
                      <p className="text-lg font-bold text-gray-900">5.0 ★</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-10 px-4 bg-white/80 backdrop-blur-sm border-y border-gray-100">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "200+", label: t.stats.students, icon: Users, color: "text-indigo-600" },
              { number: "5+", label: t.stats.experience, icon: Award, color: "text-purple-600" },
              { number: "98%", label: t.stats.recommend, icon: TrendingUp, color: "text-pink-600" },
              { number: "100%", label: t.stats.individual, icon: Target, color: "text-emerald-600" },
            ].map((stat, i) => (
              <div key={i} className="group flex flex-col items-center">
                <stat.icon className={`h-6 w-6 ${stat.color} mb-2 group-hover:scale-125 transition-transform`} />
                <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.number}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container-custom">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-sm border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-white">
              <Zap className="h-4 w-4 mr-2" />
              {t.features.sectionBadge}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.features.sectionTitle}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{t.features.sectionTitleHighlight}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.features.sectionDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.items.map((feature, index) => {
              const Icon = featureIcons[index]
              const gradients = [
                "from-blue-500 to-cyan-500",
                "from-green-500 to-emerald-500",
                "from-purple-500 to-pink-500",
                "from-orange-500 to-red-500",
                "from-indigo-500 to-blue-500",
                "from-pink-500 to-rose-500",
              ]
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${gradients[index]}`}></div>
                  <CardHeader className="text-center p-8">
                    <div className={`w-16 h-16 bg-gradient-to-r ${gradients[index]} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <CardDescription className="text-base text-gray-600 leading-relaxed text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

        <div className="container-custom relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t.howItWorks.title}
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {t.howItWorks.steps.map((step, index) => (
              <div key={index} className="relative group">
                {index < t.howItWorks.steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-white/30 z-0 -translate-y-1/2" style={{width: 'calc(100% - 2.5rem)', left: '80%'}}></div>
                )}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 text-center relative z-10">
                  <div className="text-5xl mb-4">{stepIcons[index]}</div>
                  <div className={`inline-block text-xs font-bold bg-gradient-to-r ${stepColors[index]} text-white px-3 py-1 rounded-full mb-3`}>
                    0{index + 1}
                  </div>
                  <div className="font-bold text-xl mb-3">{step.title}</div>
                  <div className="text-sm opacity-90 leading-relaxed">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold">
              <Link href="/contact">
                <Calendar className="mr-2 h-5 w-5" />
                {t.howItWorks.bookCall}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {t.testimonials.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.testimonials.subtitle}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-white shadow-2xl border-0 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <CardContent className="text-center pt-4">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl text-gray-700 mb-8 italic leading-relaxed max-w-2xl mx-auto">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-lg">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-gray-500">
                      {testimonials[currentTestimonial].role} {testimonials[currentTestimonial].flag}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentTestimonial
                      ? 'w-8 h-3 bg-indigo-600'
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full"></div>
        </div>
        <div className="container-custom text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t.cta.title}
            </h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {t.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-indigo-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold">
                <Link href="/contact">
                  <Heart className="mr-2 h-5 w-5" />
                  {t.cta.contact}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/20 font-semibold">
                <Link href="/pricing">
                  <Target className="mr-2 h-5 w-5" />
                  {t.cta.seePricing}
                </Link>
              </Button>
            </div>
            <p className="text-sm opacity-75">
              {t.cta.smallPrint}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container-custom">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Image src="/main-logo.jpeg" alt="English With Evelina" width={40} height={40} className="rounded-full object-cover" />
                <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  English With Evelina
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                {t.footer.description}
              </p>
              {/* Social Icons */}
              <div className="flex space-x-3">
                {[
                  {
                    label: "Instagram",
                    href: "#",
                    svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  },
                  {
                    label: "Facebook",
                    href: "#",
                    svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  },
                  {
                    label: "WhatsApp",
                    href: "https://wa.me/37060000000",
                    svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  },
                  {
                    label: "LinkedIn",
                    href: "#",
                    svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  }
                ].map((social) => (
                  <a key={social.label} href={social.href} aria-label={social.label} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors text-gray-400 hover:text-white">
                    {social.svg}
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: t.footer.navigation,
                links: [
                  { label: t.footer.links.home, href: "/" },
                  { label: t.footer.links.courses, href: "/courses" },
                  { label: t.footer.links.pricing, href: "/pricing" },
                  { label: t.footer.links.about, href: "/about" },
                  { label: t.footer.links.contact, href: "/contact" },
                ]
              },
              {
                title: t.footer.support,
                links: [
                  { label: t.footer.links.helpCenter, href: "/help" },
                  { label: t.footer.links.faq, href: "/help" },
                  { label: t.footer.links.contactUs, href: "/contact" },
                ]
              },
              {
                title: t.footer.legal,
                links: [
                  { label: t.footer.links.privacyPolicy, href: "/privacy" },
                  { label: t.footer.links.terms, href: "/terms" },
                ]
              }
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-4 text-lg text-white">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 group">
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              {t.footer.copyright}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">{t.footer.madeWith}</span>
              <Heart className="h-4 w-4 text-pink-500 fill-current" />
              <span className="text-gray-400 text-sm">{t.footer.by}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}