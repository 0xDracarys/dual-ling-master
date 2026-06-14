"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <div className="mb-8">
            <h1 className="heading-1 mb-6">
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="body-large max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
            <p className="body-medium text-gray-600 mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Overview */}
      <section className="section-padding-sm">
        <div className="container-custom max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="heading-4">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-small text-gray-600">
                  Your data is encrypted and protected with industry-standard security measures.
                </p>
              </CardContent>
            </Card>

            <Card className="card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="heading-4">Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-small text-gray-600">
                  We never sell your personal information to third parties.
                </p>
              </CardContent>
            </Card>

            <Card className="card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="heading-4">Transparent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-small text-gray-600">
                  You have full control over your data and can delete it anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="section-padding-sm">
        <div className="container-custom max-w-4xl">
          <div className="space-y-12">
            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Database className="w-6 h-6 mr-3 text-indigo-600" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Personal Information</h4>
                  <p className="body-medium text-gray-600">
                    When you create an account, we collect your name, email address, and password. 
                    We may also collect additional information you choose to provide, such as your profile picture, 
                    bio, and learning preferences.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Learning Data</h4>
                  <p className="body-medium text-gray-600">
                    We track your progress through courses, quiz scores, time spent learning, 
                    and other educational activities to provide personalized learning experiences.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Usage Information</h4>
                  <p className="body-medium text-gray-600">
                    We collect information about how you use our platform, including pages visited, 
                    features used, and device information to improve our services.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Eye className="w-6 h-6 mr-3 text-indigo-600" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Service Delivery</h4>
                  <p className="body-medium text-gray-600">
                    We use your information to provide, maintain, and improve our language learning platform, 
                    including personalized course recommendations and progress tracking.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Communication</h4>
                  <p className="body-medium text-gray-600">
                    We may send you important updates about your account, course progress, 
                    and new features. You can opt out of promotional emails at any time.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Analytics</h4>
                  <p className="body-medium text-gray-600">
                    We analyze usage patterns to improve our platform, develop new features, 
                    and enhance the learning experience for all users.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-indigo-600" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Encryption</h4>
                  <p className="body-medium text-gray-600">
                    All data is encrypted in transit and at rest using industry-standard encryption protocols.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Access Controls</h4>
                  <p className="body-medium text-gray-600">
                    We implement strict access controls and regularly audit who has access to your data.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Regular Updates</h4>
                  <p className="body-medium text-gray-600">
                    We regularly update our security measures and monitor for potential vulnerabilities.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <UserCheck className="w-6 h-6 mr-3 text-indigo-600" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="heading-4 mb-2">Access & Portability</h4>
                  <p className="body-medium text-gray-600">
                    You can access and download your personal data at any time through your account settings.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Correction</h4>
                  <p className="body-medium text-gray-600">
                    You can update or correct your personal information at any time.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Deletion</h4>
                  <p className="body-medium text-gray-600">
                    You can request deletion of your account and all associated data at any time.
                  </p>
                </div>
                <div>
                  <h4 className="heading-4 mb-2">Opt-out</h4>
                  <p className="body-medium text-gray-600">
                    You can opt out of marketing communications and certain data processing activities.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="heading-3 flex items-center">
                  <Mail className="w-6 h-6 mr-3 text-indigo-600" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-medium text-gray-600 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2">
                  <p className="body-medium">
                    <strong>Email:</strong> evelina@englishwithevelina.lt
                  </p>
                  <p className="body-medium">
                    <strong>Address:</strong> Lithuania
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white">
        <div className="container-custom text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="heading-2 mb-4">Questions about your privacy?</h2>
            <p className="body-large mb-8">
              We're here to help. Contact our privacy team for any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                Contact Privacy Team
                <Mail className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" className="btn-outline-primary">
                Download Your Data
                <Database className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
