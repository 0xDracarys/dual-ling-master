"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail, 
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create an account?",
        answer: "Click the 'Sign Up' button in the top right corner, fill in your details, and verify your email address. It's completely free to get started!"
      },
      {
        question: "What languages are available?",
        answer: "We offer courses in Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, Arabic, and many more languages."
      },
      {
        question: "How do I enroll in a course?",
        answer: "Browse our courses, click on one that interests you, and hit the 'Enroll' button. You'll get instant access to all course materials."
      }
    ]
  },
  {
    category: "Account & Billing",
    questions: [
      {
        question: "How much does it cost?",
        answer: "We offer a free tier with basic features. Premium plans start at $9.99/month for unlimited access to all courses and features."
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer a 30-day money-back guarantee for all paid subscriptions. Contact our support team if you're not satisfied."
      }
    ]
  },
  {
    category: "Learning & Progress",
    questions: [
      {
        question: "How do I track my progress?",
        answer: "Your dashboard shows your progress for each enrolled course, including completed lessons, quiz scores, and time spent learning."
      },
      {
        question: "Can I learn at my own pace?",
        answer: "Absolutely! All courses are self-paced. You can pause, rewind, and revisit any lesson as many times as you need."
      },
      {
        question: "Are there certificates?",
        answer: "Yes! You'll receive a certificate of completion for each course you finish, which you can share on LinkedIn and other platforms."
      }
    ]
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "What devices are supported?",
        answer: "LangExchange works on all devices - desktop computers, tablets, and mobile phones. We also have native apps for iOS and Android."
      },
      {
        question: "I'm having trouble with video playback",
        answer: "Try refreshing the page, clearing your browser cache, or switching to a different browser. If the problem persists, contact our support team."
      },
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page, enter your email address, and follow the instructions in the email we send you."
      }
    ]
  }
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <div className="mb-8">
            <h1 className="heading-1 mb-6">
              How can we <span className="gradient-text">help you?</span>
            </h1>
            <p className="body-large max-w-3xl mx-auto">
              Find answers to common questions, get support, and learn how to make the most of your language learning journey.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="section-padding-sm">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="card-interactive text-center group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="heading-4 mb-2">Live Chat</CardTitle>
                <CardDescription className="body-medium">
                  Get instant help from our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="btn-primary w-full">
                  Start Chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="card-interactive text-center group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium group-hover:scale-110 transition-transform">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="heading-4 mb-2">Email Support</CardTitle>
                <CardDescription className="body-medium">
                  Send us a detailed message
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="btn-outline-primary w-full">
                  Send Email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="card-interactive text-center group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium group-hover:scale-110 transition-transform">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="heading-4 mb-2">Phone Support</CardTitle>
                <CardDescription className="body-medium">
                  Call us for urgent issues
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="btn-outline-primary w-full">
                  Call Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding-sm">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Frequently Asked Questions</h2>
            <p className="body-large text-gray-600">
              Find quick answers to the most common questions
            </p>
          </div>

          <div className="space-y-8">
            {filteredFaqs.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="card">
                <CardHeader>
                  <CardTitle className="heading-3 text-indigo-600">
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.questions.map((faq, questionIndex) => {
                    const itemId = `${categoryIndex}-${questionIndex}`
                    const isExpanded = expandedItems.has(itemId)
                    
                    return (
                      <div key={questionIndex} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleExpanded(itemId)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="body-medium font-medium text-gray-900">
                            {faq.question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-6 pb-4">
                            <p className="body-medium text-gray-600">
                              {faq.answer}
                            </p>
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

      {/* Contact CTA */}
      <section className="section-padding bg-white">
        <div className="container-custom text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-medium">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="heading-2 mb-4">Still need help?</h2>
            <p className="body-large mb-8">
              Can't find what you're looking for? Our support team is here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                Contact Support
                <MessageCircle className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" className="btn-outline-primary">
                Browse Courses
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
