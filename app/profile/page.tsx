"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Trophy,
  Save,
  Edit,
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
} from "lucide-react"

interface UserProfile {
  uid: string
  email: string
  name: string
  role: "student" | "teacher" | "admin"
  bio: string | null
  profilePicture: string | null
  language: "en" | "lt"
  preferences: {
    theme: "light" | "dark" | "system"
    emailNotifications: boolean
    pushNotifications: boolean
  }
  stats: {
    coursesCompleted: number
    lessonsCompleted: number
    totalXP: number
    currentStreak: number
    longestStreak: number
    coursesEnrolled: number
  }
  teacherStats?: {
    coursesCreated: number
    publishedCourses: number
    totalStudents: number
    averageRating: number
  }
  subscription: {
    plan: "free" | "premium" | "enterprise"
    status: "active" | "cancelled" | "expired"
    startDate: string
    endDate: string | null
  }
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({
    name: "",
    bio: "",
  })
  const { user, token } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProfile(data.profile)
          setEditData({
            name: data.profile.name || "",
            bio: data.profile.bio || "",
          })
        } else {
          const error = await response.json()
          toast({
            title: "Error",
            description: error.error || "Failed to load profile",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchProfile()
    }
  }, [token, toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile((prev) => (prev ? { ...prev, ...data.profile } : null))
        setIsEditing(false)
        toast({
          title: "Profile updated",
          description: "Your changes have been saved successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-1">
                    <div className="h-64 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-64 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto text-center py-12">
              <CardContent>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
                <p className="text-gray-600">Unable to load your profile. Please try again.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const isStudent = profile.role === "student"
  const isTeacher = profile.role === "teacher"

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="text-center">
                    <div className="relative mx-auto mb-4">
                      <Avatar className="w-24 h-24 mx-auto">
                        {profile.profilePicture ? (
                          <AvatarImage src={profile.profilePicture} alt={profile.name} />
                        ) : null}
                        <AvatarFallback className="text-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{profile.name}</CardTitle>
                    <CardDescription className="text-sm">{profile.email}</CardDescription>
                    <Badge variant="secondary" className="mt-2 capitalize">
                      {profile.role === "teacher" ? (
                        <>
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Teacher
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-3 w-3 mr-1" />
                          Student
                        </>
                      )}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>
                          Updated {new Date(profile.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Stats or Teacher Stats */}
                {isStudent && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Learning Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BookOpen className="h-4 w-4" />
                            <span>Enrolled</span>
                          </div>
                          <span className="font-semibold">{profile.stats.coursesEnrolled}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Completed</span>
                          </div>
                          <span className="font-semibold">{profile.stats.coursesCompleted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Target className="h-4 w-4" />
                            <span>Total XP</span>
                          </div>
                          <span className="font-semibold">{profile.stats.totalXP}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingUp className="h-4 w-4" />
                            <span>Current Streak</span>
                          </div>
                          <span className="font-semibold">{profile.stats.currentStreak} days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isTeacher && profile.teacherStats && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Teaching Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BookOpen className="h-4 w-4" />
                            <span>Courses Created</span>
                          </div>
                          <span className="font-semibold">{profile.teacherStats.coursesCreated}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Published</span>
                          </div>
                          <span className="font-semibold">{profile.teacherStats.publishedCourses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Total Students</span>
                          </div>
                          <span className="font-semibold">{profile.teacherStats.totalStudents}</span>
                        </div>
                        {profile.teacherStats.averageRating > 0 && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Award className="h-4 w-4" />
                              <span>Avg Rating</span>
                            </div>
                            <span className="font-semibold">{profile.teacherStats.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Edit Profile Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your personal details and bio</CardDescription>
                      </div>
                      {!isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={editData.name}
                            onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editData.bio}
                            onChange={(e) => setEditData((prev) => ({ ...prev, bio: e.target.value }))}
                            placeholder={
                              isTeacher
                                ? "Tell students about your teaching experience and expertise..."
                                : "Tell us about your language learning goals..."
                            }
                            className="min-h-24"
                            maxLength={500}
                          />
                          <p className="text-xs text-gray-500">{editData.bio.length}/500 characters</p>
                        </div>

                        <div className="flex gap-4">
                          <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false)
                              setEditData({
                                name: profile.name,
                                bio: profile.bio || "",
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Full Name
                          </Label>
                          <p className="mt-1 text-gray-900">{profile.name}</p>
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bio</Label>
                          <p className="mt-1 text-gray-900">{profile.bio || "No bio available"}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Achievements (Students only) */}
                {isStudent && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Achievements
                      </CardTitle>
                      <CardDescription>Your learning milestones and badges</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No achievements yet</p>
                        <p className="text-sm text-gray-400 mt-1">Complete courses to earn badges!</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Subscription Info */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                    <CardDescription>Your current plan and benefits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{profile.subscription.plan} Plan</p>
                        <p className="text-sm text-gray-500 capitalize">{profile.subscription.status}</p>
                      </div>
                      <Badge variant={profile.subscription.status === "active" ? "default" : "secondary"}>
                        {profile.subscription.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
