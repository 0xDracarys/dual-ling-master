"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { 
  Settings, Globe, Shield, Bell, Palette, 
  Save, CheckCircle, AlertTriangle
} from "lucide-react"

export default function AdminSettings() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    siteName: "English With Evelina",
    contactEmail: "evelina@englishwithevelina.lt",
    supportedLanguages: "en, lt",
    aiModel: "gemini-2.5-flash",
    maxFileSize: "10",
    maintenanceMode: false,
    aiEnabled: true,
    registrationOpen: true,
    emailNotifications: true,
  })

  const handleSave = () => {
    // In a real app, POST to /api/admin/settings
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const settingSections = [
    {
      icon: Globe,
      title: "General",
      color: "from-blue-500 to-cyan-500",
      fields: [
        { key: "siteName", label: "Site Name", type: "text" },
        { key: "contactEmail", label: "Contact Email", type: "email" },
        { key: "supportedLanguages", label: "Supported Languages (comma-separated)", type: "text" },
      ],
    },
    {
      icon: Settings,
      title: "AI Configuration",
      color: "from-purple-500 to-pink-500",
      fields: [
        { key: "aiModel", label: "AI Model Name", type: "text" },
        { key: "maxFileSize", label: "Max Upload Size (MB)", type: "number" },
      ],
    },
  ]

  const toggleSettings = [
    { key: "maintenanceMode", label: "Maintenance Mode", description: "Disable public access to the site", danger: true },
    { key: "aiEnabled", label: "AI TeacherBot", description: "Enable the AI assistant for teachers", danger: false },
    { key: "registrationOpen", label: "Open Registration", description: "Allow new users to create accounts", danger: false },
    { key: "emailNotifications", label: "Email Notifications", description: "Send system emails to users", danger: false },
  ]

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Settings</h1>
              <p className="text-gray-600">Configure your platform preferences and feature flags</p>
            </div>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              {saved ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* Text Settings */}
          <div className="space-y-6 mb-8">
            {settingSections.map((section) => (
              <Card key={section.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center shadow-md`}>
                      <section.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={field.key} className="text-sm font-medium text-gray-700 mb-1 block">
                        {field.label}
                      </Label>
                      <Input
                        id={field.key}
                        type={field.type}
                        value={(settings as any)[field.key]}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="h-11 border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Flags */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>Toggle platform features on or off</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {toggleSettings.map((toggle) => (
                <div
                  key={toggle.key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    toggle.danger
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {toggle.danger && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="font-semibold text-gray-900">{toggle.label}</p>
                      <p className="text-sm text-gray-500">{toggle.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, [toggle.key]: !(prev as any)[toggle.key] }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      (settings as any)[toggle.key]
                        ? toggle.danger
                          ? "bg-red-500"
                          : "bg-indigo-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        (settings as any)[toggle.key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="mt-6 border-red-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-red-700">Danger Zone</CardTitle>
                  <CardDescription>These actions cannot be undone</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Clear AI Chat History", sub: "Delete all AI conversation logs" },
                { label: "Purge Draft Courses", sub: "Delete all unpublished course drafts" },
              ].map((action, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50">
                  <div>
                    <p className="font-semibold text-gray-900">{action.label}</p>
                    <p className="text-sm text-gray-500">{action.sub}</p>
                  </div>
                  <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    Execute
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
