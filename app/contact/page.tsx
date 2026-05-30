"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send,
  ArrowRight,
  CheckCircle,
  Users,
  Headphones,
  BookOpen,
  Zap
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    inquiryType: "general"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        inquiryType: "general"
      })
    }, 3000)
  }

  const contactInfo = [
    {
      icon: Mail,
      title: "El. paštas",
      description: "Parašykite man — atsakysiu per 24 val.",
      value: "evelina@englishwithevelina.lt",
      action: "mailto:evelina@englishwithevelina.lt"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Greitam susirašinėjimui ir klausimams",
      value: "Susisiekti per WhatsApp",
      action: "https://wa.me/37060000000"
    },
    {
      icon: Clock,
      title: "Darbo laikas",
      description: "Kada galima susisiekti",
      value: "Pir–Pen: 9:00–18:00\nSek: iš anksto",
      action: null
    },
    {
      icon: MapPin,
      title: "Vieta",
      description: "Pamokos vyksta nuotoliniu būdu",
      value: "Zoom / Google Meet",
      action: null
    }
  ]


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-8">
            <div>
              <h1 className="heading-1 mb-6">
                Susisiekite su <span className="gradient-text">Evelina</span>
              </h1>
              <p className="body-large max-w-xl">
                Turėrite klausimų dėl pamokų, kainos ar norite užsiregistruoti — mielai atsakysiu!
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                <Image
                  src="/contact-us.jpg"
                  alt="Contact Evelina"
                  width={450}
                  height={350}
                  className="relative rounded-3xl shadow-2xl object-cover w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="section-padding-sm">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="card-interactive text-center group">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium group-hover:scale-110 transition-transform">
                    <info.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="heading-4 mb-2">{info.title}</CardTitle>
                  <CardDescription className="body-medium">{info.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {info.action ? (
                    <a 
                      href={info.action} 
                      className="text-indigo-600 hover:text-indigo-800 font-medium break-all body-medium"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-gray-600 whitespace-pre-line body-medium">{info.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding-sm">
        <div className="container-custom max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="heading-2 mb-6">Send us a Message</h2>
              <p className="body-large mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              {isSubmitted ? (
                <Card className="card-elevated p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="heading-3 mb-2">Message Sent!</h3>
                  <p className="body-medium">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                </Card>
              ) : (
                <Card className="card-elevated p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="body-medium font-medium text-gray-700">Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="mt-2 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="body-medium font-medium text-gray-700">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="mt-2 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="inquiryType" className="body-medium font-medium text-gray-700">Inquiry Type</Label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleInputChange}
                        className="mt-2 w-full h-12 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                        <option value="partnership">Partnership</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="subject" className="body-medium font-medium text-gray-700">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="mt-2 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="body-medium font-medium text-gray-700">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="mt-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
