"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertTriangle 
} from "lucide-react"

interface Settings {
  notifications: {
    email: boolean
    push: boolean
    courseUpdates: boolean
    achievements: boolean
  }
  privacy: {
    profileVisibility: string
    showProgress: boolean
    showAchievements: boolean
  }
  preferences: {
    language: string
    theme: string
    timezone: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      courseUpdates: true,
      achievements: true
    },
    privacy: {
      profileVisibility: "public",
      showProgress: true,
      showAchievements: true
    },
    preferences: {
      language: "en",
      theme: "light",
      timezone: "UTC"
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const { user, token } = useAuth()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSettings(data.data)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchSettings()
    }
  }, [token])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setMessage("")
    
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage("Settings saved successfully!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to save settings")
      }
    } catch (error) {
      setMessage("Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long")
      return
    }

    setIsSaving(true)
    setMessage("")
    
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      })

      if (response.ok) {
        setMessage("Password changed successfully!")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to change password")
      }
    } catch (error) {
      setMessage("Error changing password")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container-custom section-padding-sm">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-custom section-padding-sm">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="heading-1 mb-4">Settings</h1>
              <p className="body-large">Manage your account preferences and privacy settings</p>
            </div>

            {message && (
              <Alert className={`mb-6 ${message.includes("successfully") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                {message.includes("successfully") ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.includes("successfully") ? "text-green-700" : "text-red-700"}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-8">
              {/* Notifications Settings */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="heading-3 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-indigo-600" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified about updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="body-medium font-medium">Email Notifications</Label>
                      <p className="body-small text-gray-500">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="body-medium font-medium">Push Notifications</Label>
                      <p className="body-small text-gray-500">Receive browser notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, push: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="body-medium font-medium">Course Updates</Label>
                      <p className="body-small text-gray-500">Get notified about course changes</p>
                    </div>
                    <Switch
                      checked={settings.notifications.courseUpdates}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, courseUpdates: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="body-medium font-medium">Achievements</Label>
                      <p className="body-small text-gray-500">Get notified about new achievements</p>
                    </div>
                    <Switch
                      checked={settings.notifications.achievements}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, achievements: checked }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="heading-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Privacy
                  </CardTitle>
                  <CardDescription>Control who can see your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="body-medium font-medium">Profile Visibility</Label>
                    <Select
                      value={settings.privacy.profileVisibility}
                      onValueChange={(value) => 
                        setSettings(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, profileVisibility: value }
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="body-medium font-medium">Show Progress</Label>
                      <p className="body-small text-gray-500">Allow others to see your learning progress</p>
                    </div>
                    <Switch
                      checked={settings.privacy.showProgress}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, showProgress: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="body-medium font-medium">Show Achievements</Label>
                      <p className="body-small text-gray-500">Display your achievements publicly</p>
                    </div>
                    <Switch
                      checked={settings.privacy.showAchievements}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, showAchievements: checked }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="heading-3 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Preferences
                  </CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="body-medium font-medium">Language</Label>
                      <Select
                        value={settings.preferences.language}
                        onValueChange={(value) => 
                          setSettings(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, language: value }
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="body-medium font-medium">Theme</Label>
                      <Select
                        value={settings.preferences.theme}
                        onValueChange={(value) => 
                          setSettings(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, theme: value }
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="heading-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Security
                  </CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="body-medium font-medium">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="body-medium font-medium">New Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="body-medium font-medium">Confirm New Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
                    className="btn-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save All Settings"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
