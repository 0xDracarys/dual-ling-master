"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Search, Edit, Trash2, Users } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

interface User {
  _id: string
  username: string
  email: string
  role: "student" | "teacher" | "admin"
  coursesEnrolled: number
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState("")
  const [editingAiEnabled, setEditingAiEnabled] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const list = (data.users || data.data?.users || []).map((u: any) => ({
            ...u,
            _id: u.id || u._id
          }))
          setUsers(list)
          setFilteredUsers(list)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchUsers()
    }
  }, [token])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser._id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (newRole === "teacher") {
        await fetch(`/api/admin/users/${editingUser._id}/ai-access`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ aiEnabled: editingAiEnabled }),
        })
      }

      if (response.ok) {
        setUsers(users.map((user) => 
          user._id === editingUser._id 
            ? { ...user, role: newRole as any, aiEnabled: newRole === "teacher" ? editingAiEnabled : false } 
            : user
        ))
        setEditingUser(null)
        setNewRole("")
      }
    } catch (error) {
      console.error("Error updating user role:", error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setUsers(users.filter((user) => user._id !== userId))
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "teacher":
        return "default"
      case "student":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>AI Features Status</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === "teacher" ? (
                            <Badge 
                              variant={user.aiEnabled ? "default" : "outline"} 
                              className={user.aiEnabled ? "bg-purple-600 hover:bg-purple-700 text-white border-transparent" : "border-gray-300"}
                            >
                              {user.aiEnabled ? "AI Access Granted" : "No AI Access"}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.coursesEnrolled} enrolled</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/users/${user._id}`}>
                              <Button variant="outline" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                View Profile
                              </Button>
                            </Link>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUser(user)
                                    setNewRole(user.role)
                                    setEditingAiEnabled(!!user.aiEnabled)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User Profile & Role</DialogTitle>
                                  <DialogDescription>Modify permissions for {editingUser?.username}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {newRole === "teacher" && (
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-purple-100 bg-purple-50/50">
                                      <div>
                                        <p className="font-semibold text-gray-900 text-sm">AI Course Outline Generator</p>
                                        <p className="text-xs text-gray-500">Allow this teacher to use Gemini AI features</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setEditingAiEnabled(!editingAiEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                          editingAiEnabled ? "bg-purple-600" : "bg-gray-300"
                                        }`}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            editingAiEnabled ? "translate-x-6" : "translate-x-1"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  )}

                                  <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button variant="outline" onClick={() => setEditingUser(null)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleUpdateRole}>Save Changes</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>


                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
