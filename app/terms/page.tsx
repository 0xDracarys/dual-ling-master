"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Scale, Users, Shield, AlertTriangle, CheckCircle } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <div className="mb-8">
            <h1 className="heading-1 mb-6">
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="body-large max-w-3xl mx-auto">
              These terms govern your use of LangExchange. Please read them carefully before using our platform.
            </p>
            <p className="body-medium text-gray-600 mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Terms Overview */}
      <section className="section-padding-sm">
        <div className="container-custom max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="heading-4">Fair Use</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-small text-gray-600">
                  Use our platform responsibly and in accordance with these terms.
                </p>
              </CardContent>
            </Card>

            <Card className="card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="heading-4">Respectful</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-small text-gray-600">
                  Treat other users and our team with respect and kindness.
                </p>
              </CardContent>
            </Card>

            <Card className="card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="heading-4">Protected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-small text-gray-600">
                  Your rights and our platform are protected by these terms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="section-padding-sm">
        <div className="container-custom max-w-4xl">
          <div className="space-y-12">
            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-indigo-600" />
                  Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="body-medium text-gray-600">
                  By accessing or using LangExchange, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our platform.
                </p>
                <p className="body-medium text-gray-600">
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  material changes through our platform or via email.
                </p>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Users className="w-6 h-6 mr-3 text-indigo-600" />
                  User Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Account Creation</h4>
                  <p className="body-medium text-gray-600">
                    You must provide accurate and complete information when creating your account. 
                    You are responsible for maintaining the security of your account credentials.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Account Responsibility</h4>
                  <p className="body-medium text-gray-600">
                    You are responsible for all activities that occur under your account. 
                    Notify us immediately of any unauthorized use of your account.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Age Requirements</h4>
                  <p className="body-medium text-gray-600">
                    You must be at least 13 years old to use our platform. Users under 18 must have 
                    parental consent to create an account.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Scale className="w-6 h-6 mr-3 text-indigo-600" />
                  Acceptable Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Permitted Uses</h4>
                  <p className="body-medium text-gray-600">
                    You may use our platform for personal, non-commercial language learning purposes. 
                    You may share your progress and achievements with others.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Prohibited Activities</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Violating any applicable laws or regulations</li>
                    <li>Attempting to gain unauthorized access to our systems</li>
                    <li>Interfering with other users' learning experience</li>
                    <li>Sharing inappropriate, offensive, or harmful content</li>
                    <li>Using automated tools to access our platform</li>
                    <li>Reselling or redistributing our content</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-indigo-600" />
                  Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Our Content</h4>
                  <p className="body-medium text-gray-600">
                    All content on our platform, including courses, videos, text, and software, 
                    is owned by LangExchange or our licensors and protected by copyright laws.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Your Content</h4>
                  <p className="body-medium text-gray-600">
                    You retain ownership of content you create and share on our platform. 
                    By sharing content, you grant us a license to use it for platform operations.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Respect for Rights</h4>
                  <p className="body-medium text-gray-600">
                    You may not use our content for commercial purposes without permission. 
                    Respect the intellectual property rights of others.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-3 text-indigo-600" />
                  Disclaimers and Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Service Availability</h4>
                  <p className="body-medium text-gray-600">
                    We strive to provide reliable service but cannot guarantee uninterrupted access. 
                    We may temporarily suspend service for maintenance or updates.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Learning Outcomes</h4>
                  <p className="body-medium text-gray-600">
                    While we provide quality educational content, learning outcomes depend on individual 
                    effort and commitment. We cannot guarantee specific results.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Limitation of Liability</h4>
                  <p className="body-medium text-gray-600">
                    Our liability is limited to the maximum extent permitted by law. 
                    We are not responsible for indirect or consequential damages.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-indigo-600" />
                  Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Your Right to Terminate</h4>
                  <p className="body-medium text-gray-600">
                    You may terminate your account at any time through your account settings 
                    or by contacting our support team.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Our Right to Terminate</h4>
                  <p className="body-medium text-gray-600">
                    We may suspend or terminate your account if you violate these terms 
                    or engage in harmful activities.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Effect of Termination</h4>
                  <p className="body-medium text-gray-600">
                    Upon termination, your right to use the platform ceases immediately. 
                    We may retain certain information as required by law.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Scale className="w-6 h-6 mr-3 text-indigo-600" />
                  Governing Law
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-medium text-gray-600 mb-4">
                  These terms are governed by the laws of the jurisdiction where LangExchange is incorporated. 
                  Any disputes will be resolved through binding arbitration.
                </p>
                <p className="body-medium text-gray-600">
                  If any provision of these terms is found to be unenforceable, the remaining provisions 
                  will remain in full force and effect.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white">
        <div className="container-custom text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="heading-2 mb-4">Questions about our terms?</h2>
            <p className="body-large mb-8">
              We're here to help clarify any questions you may have about our Terms of Service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                Contact Legal Team
                <FileText className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" className="btn-outline-primary">
                Start Learning
                <Users className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
