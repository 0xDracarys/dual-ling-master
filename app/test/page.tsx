"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, User, BookOpen, Shield } from "lucide-react"

export default function TestPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [message, setMessage] = useState("")
  const [accounts, setAccounts] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any>(null)

  const createTestAccounts = async () => {
    setIsCreating(true)
    setMessage("")
    
    try {
      const response = await fetch("/api/test/create-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Test accounts created successfully!")
        setAccounts(data.data)
        // Also refresh the users list
        loadAllUsers()
      } else {
        setMessage(`Error: ${data.error || "Failed to create accounts"}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsCreating(false)
    }
  }

  const loadAllUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch("/api/test/list-users", {
        method: "GET",
      })

      const data = await response.json()

      if (response.ok) {
        setAllUsers(data.data)
      } else {
        console.error("Failed to load users:", data.error)
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container-custom section-padding-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="heading-1 mb-4">Test Account Creation</h1>
            <p className="body-large">Create test accounts to explore the platform features</p>
          </div>

          <Card className="card-elevated mb-8">
            <CardHeader>
              <CardTitle className="heading-3">Create Test Accounts</CardTitle>
              <CardDescription>
                This will create three test accounts with different roles for testing purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={createTestAccounts} 
                  disabled={isCreating}
                  className="btn-primary"
                >
                  {isCreating ? "Creating Accounts..." : "Create Test Accounts"}
                </Button>
                
                <Button 
                  onClick={loadAllUsers} 
                  disabled={isLoadingUsers}
                  className="btn-secondary"
                >
                  {isLoadingUsers ? "Loading..." : "Show All Users in DB"}
                </Button>
              </div>

              {message && (
                <Alert className={`mt-6 ${message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className={message.includes("Error") ? "text-red-700" : "text-green-700"}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {allUsers && (
            <Card className="card-elevated mb-8">
              <CardHeader>
                <CardTitle className="heading-3">All Users in Database ({allUsers.count})</CardTitle>
                <CardDescription>
                  Complete list of all users currently stored in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.users.map((user: any, index: number) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.firstName?.[0] || user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">@{user.username} • {user.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {accounts && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="heading-4">Student Account</CardTitle>
                      <CardDescription>Learn languages</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> teststudent@example.com</p>
                    <p><strong>Password:</strong> password123</p>
                    <p><strong>Role:</strong> Student</p>
                  </div>
                  <Button className="w-full mt-4 btn-secondary" asChild>
                    <a href="/auth/login">Login as Student</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="heading-4">Teacher Account</CardTitle>
                      <CardDescription>Teach languages</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> testteacher@example.com</p>
                    <p><strong>Password:</strong> password123</p>
                    <p><strong>Role:</strong> Teacher</p>
                  </div>
                  <Button className="w-full mt-4 btn-secondary" asChild>
                    <a href="/auth/login">Login as Teacher</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="heading-4">Admin Account</CardTitle>
                      <CardDescription>Manage platform</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> testadmin@example.com</p>
                    <p><strong>Password:</strong> password123</p>
                    <p><strong>Role:</strong> Admin</p>
                  </div>
                  <Button className="w-full mt-4 btn-secondary" asChild>
                    <a href="/auth/login">Login as Admin</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="card-elevated mt-8">
            <CardHeader>
              <CardTitle className="heading-3">Test Features</CardTitle>
              <CardDescription>
                Once you've created accounts, you can test these features:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Student Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Browse and enroll in courses</li>
                    <li>• Take interactive lessons</li>
                    <li>• Complete quizzes and track progress</li>
                    <li>• View personalized dashboard</li>
                    <li>• Track learning statistics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Teacher Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Create and manage courses</li>
                    <li>• Add lessons and quizzes</li>
                    <li>• View student progress</li>
                    <li>• Access teacher dashboard</li>
                    <li>• Manage course content</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
