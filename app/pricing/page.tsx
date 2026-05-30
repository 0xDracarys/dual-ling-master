"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, MessageCircle, ArrowRight, Calendar, Users, BookOpen, Zap } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Viena pamoka",
      subtitle: "Single Lesson",
      price: "35",
      currency: "€",
      per: "pamoka",
      description: "Tobula pradedantiesiems arba norintiems išbandyti mokymosi stilių",
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      features: [
        "60 min. individuali pamoka",
        "Prisitaikyta prie jūsų lygio",
        "Garso ir vaizdo medžiaga",
        "Namų darbai po pamokos",
        "El. pašto palaikymas",
      ],
      cta: "Rezervuoti pamoką",
      href: "/contact",
      popular: false,
    },
    {
      name: "Mėnesinis paketas",
      subtitle: "Monthly Package",
      price: "120",
      currency: "€",
      per: "mėn.",
      description: "Geriausias pasirinkimas nuosekliam mokymosi progresui",
      icon: Zap,
      gradient: "from-indigo-600 to-purple-600",
      features: [
        "4 x 60 min. pamokos per mėnesį",
        "Individualus mokymosi planas",
        "Papildoma mokymosi medžiaga",
        "Progreso stebėjimas ir ataskaitos",
        "WhatsApp / el. pašto palaikymas",
        "Lankstus tvarkaraštis",
      ],
      cta: "Pradėti dabar",
      href: "/contact",
      popular: true,
    },
    {
      name: "Intensyvus kursas",
      subtitle: "Intensive Course",
      price: "280",
      currency: "€",
      per: "kursas",
      description: "Greitam progresui per 4 savaites — 3 pamokos per savaitę",
      icon: Users,
      gradient: "from-purple-600 to-pink-600",
      features: [
        "12 x 60 min. pamokų",
        "Detali pradinė kalbos diagnostika",
        "Individualizuota programa",
        "Visa mokymosi medžiaga įskaičiuota",
        "Neribota komunikacija tarp pamokų",
        "Baigiamasis progreso vertinimas",
        "Sertifikatas apie mokymosi eigą",
      ],
      cta: "Susisiekti dėl kurso",
      href: "/contact",
      popular: false,
    },
  ]

  const testimonials = [
    {
      name: "Rasa K.",
      role: "Vadovė, Vilnius",
      content: "Dėl Evelinos pamokų galiu drąsiai bendrauti su užsienio partneriais. Metodas labai praktiškas ir aiškus.",
      rating: 5,
      initials: "RK",
    },
    {
      name: "Tomas M.",
      role: "IT specialistas",
      content: "Po 3 mėnesių pamokų su Evelina gaunu darbo pasiūlymus iš tarptautinių kompanijų. Rekomenduoju visiems!",
      rating: 5,
      initials: "TM",
    },
    {
      name: "Gintarė P.",
      role: "Studentė",
      content: "Bijojau kalbėti angliškai, dabar jaučiuosi užtikrintai. Evelina sukuria tokią aplinką, kur nesibaimini klysti.",
      rating: 5,
      initials: "GP",
    },
  ]

  const faqs = [
    {
      question: "Kaip vyksta pamokos?",
      answer: "Pamokos vyksta nuotoliniu būdu per Zoom arba Google Meet. Reikia tik kompiuterio ir interneto ryšio.",
    },
    {
      question: "Kokiam lygiui tinka pamokos?",
      answer: "Dirbu su A1–C1 lygiu. Prieš pradedant pamokas atliekame nemokamą diagnostinį pokalbį, kad nustatyčiau jūsų lygį.",
    },
    {
      question: "Ar galiu atšaukti arba perkelti pamoką?",
      answer: "Taip — pamoką galite perkelti arba atšaukti iki 24 val. prieš jos pradžią be jokių papildomų mokesčių.",
    },
    {
      question: "Ar galimas bandomasis susitikimas?",
      answer: "Taip! Siūlau nemokamą 20 min. pažintinį pokalbį, kurio metu aptarsime jūsų tikslus ir poreikius.",
    },
    {
      question: "Kokia mokėjimo tvarka?",
      answer: "Atsiskaitymas galimas per banko pavedimą arba PayPal. Mėnesinis paketas apmokamas iš anksto mėnesio pradžioje.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container-custom text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <Calendar className="h-4 w-4 mr-2" />
            Laisva data — susisiekite jau šiandien
          </div>
          <h1 className="heading-1 mb-6">
            Paprasti, skaidrūs{" "}
            <span className="gradient-text">kainos planai</span>
          </h1>
          <p className="body-large max-w-2xl mx-auto mb-4">
            Investuokite į save — kiekviena pamoka su Evelina yra žingsnis arčiau laisvo bendravimo anglų kalba.
          </p>
          <p className="text-sm text-gray-500">
            Kaina nurodytas be PVM. Galimas pirmasis nemokamas pažintinis pokalbis.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  plan.popular
                    ? "ring-2 ring-indigo-500 shadow-xl scale-105"
                    : "shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-1 text-sm shadow-lg">
                      ✨ Populiariausias
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8">
                  <div className={`w-14 h-14 bg-gradient-to-r ${plan.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <plan.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <p className="text-sm text-indigo-600 font-medium">{plan.subtitle}</p>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  <div className="mt-5">
                    <span className="text-5xl font-black text-gray-900">{plan.currency}{plan.price}</span>
                    <span className="text-gray-500 ml-1">/{plan.per}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 px-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 bg-gradient-to-r ${plan.gradient} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6 pb-8 px-6">
                  <Link href={plan.href} className="w-full">
                    <Button
                      className={`w-full py-6 text-base font-semibold transition-all duration-300 hover:scale-105 ${
                        plan.popular
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
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

      {/* Free intro call banner */}
      <section className="py-12 px-4">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center shadow-2xl">
            <MessageCircle className="h-10 w-10 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-3">Nežinote nuo ko pradėti?</h2>
            <p className="text-indigo-100 mb-6 text-lg">
              Susisiekite dėl nemokamo 20 min. pažintinio pokalbio — aptarsime jūsų tikslus ir parinksime tinkamiausią planą.
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100 font-semibold px-8 py-4 text-base transition-all hover:scale-105">
                Gauti nemokamą konsultaciją
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container-custom">
          <h2 className="heading-2 text-center mb-4">Ką sako mano mokiniai</h2>
          <p className="body-large text-center mb-12 max-w-xl mx-auto">
            Tikri rezultatai iš tikrų žmonių — ne tik gramatika, o pasitikėjimas kalbant.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1">
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-5 italic leading-relaxed">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="heading-2 text-center mb-12">Dažniausiai užduodami klausimai</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">Pradėkite savo kelionę šiandien</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Nebijokite klysti — tai natūrali mokymosi proceso dalis. Kartu rasime jūsų tempą ir metodą.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100 text-lg px-8 py-6 font-semibold hover:scale-105 transition-all">
                Susisiekite dabar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" className="btn-outline-white text-lg px-8 py-6">
                Peržiūrėti kursus
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
