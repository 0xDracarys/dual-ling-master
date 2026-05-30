"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Target, 
  Award, 
  Heart, 
  Globe, 
  BookOpen, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  MessageCircle,
  Lightbulb
} from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("mission")

  const stats = [
    { number: "50,000+", label: "Active Learners", icon: Users },
    { number: "25+", label: "Languages", icon: Globe },
    { number: "500+", label: "Courses", icon: BookOpen },
    { number: "98%", label: "Success Rate", icon: Award }
  ]

  const values = [
    {
      icon: Heart,
      title: "Aistros dėstyti",
      description: "Tikiu, kad kiekvienas gali išmokti anglų kalbos — reikia tik tinkamo metodo ir palaikymo."
    },
    {
      icon: Target,
      title: "Rezultatai — praktikoje",
      description: "Mokau ne tik gramatikos, bet ir realaus kalbėjimo — kad anglų kalba taptumų īrankiu, o ne iššūkiu."
    },
    {
      icon: Users,
      title: "Individualus požiūris",
      description: "Kiekvienas mokinys yra skirtingas. Programa visada kuriama būtent jūsų tempui ir tikslams."
    },
    {
      icon: Zap,
      title: "Lankstumas",
      description: "Pamokos vyksta nuotoliniu būdu — jūsų patogiu laiku, nepriklausomai nuo vietos."
    }
  ]

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former language teacher with 10+ years of experience in educational technology.",
      avatar: "SC",
      expertise: ["Educational Technology", "Language Learning", "Product Strategy"]
    },
    {
      name: "Marcus Johnson",
      role: "CTO & Co-Founder",
      bio: "Full-stack developer passionate about creating scalable learning platforms.",
      avatar: "MJ",
      expertise: ["Software Engineering", "AI/ML", "Platform Architecture"]
    },
    {
      name: "Elena Rodriguez",
      role: "Head of Content",
      bio: "Linguist and curriculum designer with expertise in multiple languages.",
      avatar: "ER",
      expertise: ["Linguistics", "Curriculum Design", "Content Strategy"]
    },
    {
      name: "David Kim",
      role: "Head of Community",
      bio: "Community builder focused on creating meaningful learning connections.",
      avatar: "DK",
      expertise: ["Community Management", "User Experience", "Social Learning"]
    }
  ]

  const timeline = [
    {
      year: "2020",
      title: "The Beginning",
      description: "Founded with a vision to make language learning accessible to everyone worldwide."
    },
    {
      year: "2021",
      title: "First 1,000 Users",
      description: "Launched our beta platform and welcomed our first community of language learners."
    },
    {
      year: "2022",
      title: "AI Integration",
      description: "Introduced AI-powered personalized learning paths and adaptive assessments."
    },
    {
      year: "2023",
      title: "Global Expansion",
      description: "Expanded to 25+ languages and reached learners in 50+ countries."
    },
    {
      year: "2024",
      title: "Next Generation",
      description: "Launched advanced features including 1-on-1 tutoring and team management."
    }
  ]

  const tabs = [
    { id: "mission", label: "Our Mission", icon: Target },
    { id: "story", label: "Our Story", icon: BookOpen },
    { id: "team", label: "Our Team", icon: Users },
    { id: "impact", label: "Our Impact", icon: TrendingUp }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Instructor Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl blur-2xl opacity-20 transform -rotate-3"></div>
                <Image
                  src="/about-us-image.jpg"
                  alt="Evelina - anglų kalbos mokytoja"
                  width={450}
                  height={550}
                  className="relative rounded-3xl shadow-2xl object-cover w-full h-auto"
                  priority
                />
              </div>
            </div>

            {/* Text */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Know Your Instructor
              </h1>
              <p className="text-xl font-semibold text-gray-800 mb-4">
                Labas, aš Evelina — anglų kalbos mokytoja ir nuotolinės anglų kalbos mokyklos kūrėja. 👋
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Padedu suaugusiems mokytis anglų kalbos aiškiai, praktiškai ir be baimės kalbėti. Tikiu, kad kiekvienas gali išmokti kalbėti angliškai, kai mokymasis tampa suprantamas, pritaikytas žmogui ir paremtas realiu naudojimu, o ne vien teorija.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Pamokose orientuojuosi ne tik į gramatiką ar taisykles, bet ir į pasitikėjimą savimi kalbant. Man svarbu, kad mokiniai jaustųsi jaukiai, nebijotų klysti ir matytų realų progresą kasdienėje anglų kalboje.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Dirbdama su mokiniais pastebėjau, kad daugeliui trūksta ne gebėjimų, o aiškios sistemos, praktikos ir palaikymo. Todėl kuriu mokymosi erdvę, kur anglų kalba tampa paprastesnė, artimesnė ir lengviau pritaikoma gyvenime.
              </p>
              <p className="text-base font-semibold text-gray-800 mb-2">Čia rasi:</p>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✨ individualias anglų kalbos pamokas,</li>
                <li>✨ praktišką ir šiuolaikišką mokymosi metodą,</li>
                <li>✨ palaikančią aplinką augti,</li>
                <li>✨ bei turinį, kuris padeda mokytis natūraliai.</li>
              </ul>
              <p className="text-lg text-indigo-700 font-medium mb-8">
                Mano tikslas — padėti tau ne tik mokytis anglų kalbos, bet ir ja naudotis užtikrintai.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/courses">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6">
                    Peržiūrėti kursus
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" className="btn-outline-primary text-lg px-8 py-6">
                    Susisiekti
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ką svarbu man, kaip mokytojai</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Mano mokymo filosofija — tai daugiau nei taisyklės ir gramatika.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">{value.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Pasiruošę pradėti?</h2>
          <p className="text-xl mb-8 opacity-90">
            Susisiekite ir aptarsime, kaip galiu padėti jūsų anglų kalbos kelionėje.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6">
                Peržiūrėti kainas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="btn-outline-white text-lg px-8 py-6">
                Susisiekti
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
