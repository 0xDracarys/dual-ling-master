"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Award, Globe, ArrowRight, CheckCircle, Star, Play, Zap, Shield, Clock, Heart, Sparkles, Target, TrendingUp, Brain, Languages, Trophy, MessageCircle } from "lucide-react"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      name: "Marta Kazlauskienė",
      role: "Lithuanian Language Teacher",
      content: "This platform is perfect for English speakers learning Lithuanian. The cultural context and grammar explanations are exactly what my students need!",
      rating: 5,
      avatar: "MK",
      flag: "🇱🇹"
    },
    {
      name: "Jonas Petras",
      role: "Software Engineer", 
      content: "As a Lithuanian speaker, the English courses here address all the specific challenges I face. The grammar explanations are incredibly helpful.",
      rating: 5,
      avatar: "JP",
      flag: "🇱🇹"
    },
    {
      name: "Dr. Paulius Rimkus",
      role: "University Professor",
      content: "The specialized approach for Lithuanian-English learning is outstanding. My students show remarkable progress using this platform.",
      rating: 5,
      avatar: "PR",
      flag: "🇱🇹"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>


      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto">
          <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Labas, aš Evelina
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                    anglų kalbos mokytoja ir nuotolinės mokyklos kūrėja.
                  </span>
                </h1>

                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  Padedu suaugusiems mokytis anglų kalbos aiškiai, praktiškai ir be baimės kalbėti. Tikiu, kad kiekvienas gali išmokti kalbėti angliškai, kai mokymasis tampa suprantamas, pritaikytas realiam gyvenimui ir paremtas palaikymu, o ne spaudimu.
                </p>

                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  Savo pamokose daug dėmesio skiriu ne tik gramatikai, bet ir pasitikėjimui savimi kalbant. Man svarbu, kad mokiniai jaustųsi jaukiai, nebijotų klysti ir matytų tikrą progresą.
                </p>

                <p className="text-base font-semibold text-gray-800 mb-2">Čia rasi:</p>
                <ul className="space-y-1 mb-6 text-gray-700">
                  <li>✨ individualias anglų kalbos pamokas,</li>
                  <li>✨ praktišką ir šiuolaikišką mokymosi metodą,</li>
                  <li>✨ palaikančią aplinką augti ir tobulėti.</li>
                </ul>

                <p className="text-lg text-indigo-700 font-medium mb-8">
                  Mano tikslas — padėti tau ne tik mokytis anglų kalbos, bet ir ja naudotis užtikrintai.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <Link href="/auth/register">
                      Pradėti mokytis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild className="btn-outline-primary text-lg px-8 py-6">
                    <Link href="/courses">
                      <Play className="mr-2 h-5 w-5" />
                      Peržiūrėti kursus
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Hero Image */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl blur-2xl opacity-20 transform rotate-3"></div>
                  <Image
                    src="/portfolio-hero-image.jpg"
                    alt="Evelina - anglų kalbos mokytoja"
                    width={500}
                    height={600}
                    className="relative rounded-3xl shadow-2xl object-cover w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-sm border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-white">
              <Zap className="h-4 w-4 mr-2" />
              Ką gausite mokydamiesi su Evelina?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Kodėl mokytis su
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Evelina?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuotolinės anglų kalbos pamokos, kuriose svarbu ne tik gramatika, bet ir pasitikėjimas savimi kalbant.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Lessons",
                description: "Personalized learning paths that adapt to your progress and learning style for maximum efficiency.",
                color: "blue",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: "Expert Instructors",
                description: "Learn from certified language teachers and native speakers with years of teaching experience.",
                color: "green",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Award,
                title: "Smart Progress Tracking",
                description: "Advanced analytics show your strengths, weaknesses, and personalized recommendations for improvement.",
                color: "purple",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Globe,
                title: "Global Community",
                description: "Connect with 50,000+ learners worldwide, practice conversations, and immerse in diverse cultures.",
                color: "orange",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is protected with enterprise-grade security. Learn with complete peace of mind.",
                color: "indigo",
                gradient: "from-indigo-500 to-blue-500"
              },
              {
                icon: Clock,
                title: "Flexible Learning",
                description: "Study anytime, anywhere with 24/7 access. Perfect for busy schedules and different time zones.",
                color: "pink",
                gradient: "from-pink-500 to-rose-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center p-8">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </CardTitle>
            </CardHeader>
                <CardContent className="px-8 pb-8">
                  <CardDescription className="text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
          </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Learn With Evelina */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Anglų kalbos mokymas — paprastai ir efektyviai
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Individuali programa, prisitaikyta būtent prie jūsų — jūsų tempo, tikslų ir gyvenimo ritmo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
            {[
              { 
                icon: "🎯", 
                title: "Aiški sistema", 
                desc: "Jokios painiavos — tik tai, kas tikrai reikalinga jūsų gyvenime ir darbe."
              },
              { 
                icon: "💬", 
                title: "Kalbėjimo praktika", 
                desc: "Kiekviena pamoka — tai reali komunikacija, o ne tik teorija ar taisyklės."
              },
              { 
                icon: "🤝", 
                title: "Palaikanti aplinka", 
                desc: "Mokotės be spaudimo ir baimės klysti — nes klaidos yra natūrali pažangos dalis."
              }
            ].map((item, index) => (
              <div key={index} className="group hover:scale-105 transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="font-bold text-xl mb-3">{item.title}</div>
                <div className="text-sm opacity-90 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Skaičiai, kurie kalba patys už save
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Evelinos mokiniai — suaugę profesionalai, studentai ir verslininkai, kurie norėjo realaus progreso.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "200+", label: "Patenkintų mokinių", icon: Users, color: "from-blue-500 to-cyan-500" },
              { number: "5+", label: "Metų patirtis", icon: Award, color: "from-green-500 to-emerald-500" },
              { number: "98%", label: "Rekomenduoja draugams", icon: TrendingUp, color: "from-purple-500 to-pink-500" },
              { number: "100%", label: "Individuali programa", icon: Target, color: "from-orange-500 to-red-500" }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform text-gray-900">
                  {stat.number}
                </div>
                <div className="text-lg text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What Our Learners Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our community has to say about their learning experience.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-white shadow-xl">
              <CardContent className="text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl text-gray-700 mb-6 italic">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-lg">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-gray-500">
                      {testimonials[currentTestimonial].role} {testimonials[currentTestimonial].flag}
                    </div>
                  </div>
                </div>
              </CardContent>
          </Card>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pasiruošę pradėti savo anglų kalbos kelionę?
            </h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Susisiekite jau šiandien — pirmasis pažintinis pokalbis yra nemokamas ir niekam nieko įpareigojantis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-indigo-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <Link href="/contact">
                  <Heart className="mr-2 h-5 w-5" />
                  Susisiekti su Evelina
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild className="btn-outline-white text-lg px-8 py-6">
                <Link href="/pricing">
                  <Target className="mr-2 h-5 w-5" />
                  Peržiūrėti kainas
                </Link>
              </Button>
            </div>
            <p className="text-sm opacity-75">
              ✨ Nemokamas pirmasis pokalbis • Individuali programa • Lankstus tvarkaraštis
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Image src="/main-logo.jpeg" alt="English With Evelina" width={40} height={40} className="rounded-full object-cover" />
                <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  English With Evelina
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Padedu suaugusiems mokytis anglų kalbos aiškiai, praktiškai ir be baimės kalbėti.
              </p>
              <div className="flex space-x-4">
                {['Twitter', 'Facebook', 'LinkedIn', 'Instagram'].map((social) => (
                  <div key={social} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                    <span className="text-sm font-semibold">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {[
              {
                title: "Navigacija",
                links: [
                  { label: "Pagrindinis", href: "/" },
                  { label: "Kursai", href: "/courses" },
                  { label: "Kainos", href: "/pricing" },
                  { label: "Apie mane", href: "/about" },
                  { label: "Kontaktai", href: "/contact" },
                ]
              },
              {
                title: "Pagalba",
                links: [
                  { label: "Pagalbos centras", href: "/help" },
                  { label: "DUK", href: "/help" },
                  { label: "Susisiekti", href: "/contact" },
                ]
              },
              {
                title: "Teisinė informacija",
                links: [
                  { label: "Privatumo politika", href: "/privacy" },
                  { label: "Paslaugų teikimo sąlygos", href: "/terms" },
                ]
              }
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-4 text-lg">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 English With Evelina. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Made with ❤️ by Evelina</span>
            </div>
        </div>
      </div>
      </footer>
    </div>
  )
}