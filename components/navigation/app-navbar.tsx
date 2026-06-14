"use client"

import * as React from "react";
import { useRouter } from "next/navigation";
import { Book, GraduationCap, BarChart, Settings as SettingsIcon, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar1 } from "@/components/ui/shadcnblocks-com-navbar1";

export function AppNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Role-based menu configuration
  const getMenu = () => {
    const baseMenu = [
      { title: "Home", url: "/" },
      { title: "Courses", url: "/courses" },
      { title: "Pricing", url: "/pricing" },
      { title: "About", url: "/about" },
      { title: "Contact", url: "/contact" },
    ];

    if (!user) {
      return baseMenu;
    }

    // Add dashboard link based on role
    const dashboardUrl = 
      user.role === "admin" ? "/admin/dashboard" :
      user.role === "teacher" ? "/teacher/dashboard" :
      "/dashboard";

    // Teacher-specific menu
    if (user.role === "teacher") {
      return [
        { title: "Home", url: "/" },
        {
          title: "My Teaching",
          url: "#",
          items: [
            {
              title: "Dashboard",
              description: "View your teaching statistics",
              icon: <BarChart className="size-5 shrink-0" />,
              url: dashboardUrl,
            },
            {
              title: "My Courses",
              description: "Manage your language courses",
              icon: <Book className="size-5 shrink-0" />,
              url: "/teacher/course/create",
            },
            {
              title: "My Students",
              description: "View and manage enrolled students",
              icon: <Users className="size-5 shrink-0" />,
              url: "/teacher/students",
            },
            {
              title: "AI Assistant",
              description: "Create courses with AI help",
              icon: <GraduationCap className="size-5 shrink-0" />,
              url: "/teacher/ai-assistant",
            },
          ],
        },
        { title: "Courses", url: "/courses" },
        { title: "Pricing", url: "/pricing" },
        { title: "Help", url: "/help" },
      ];
    }

    // Student-specific menu
    if (user.role === "student") {
      return [
        { title: "Home", url: "/" },
        {
          title: "My Learning",
          url: "#",
          items: [
            {
              title: "Dashboard",
              description: "Track your learning progress",
              icon: <BarChart className="size-5 shrink-0" />,
              url: dashboardUrl,
            },
            {
              title: "My Courses",
              description: "View enrolled courses",
              icon: <Book className="size-5 shrink-0" />,
              url: dashboardUrl,
            },
            {
              title: "Browse Courses",
              description: "Find new language courses",
              icon: <GraduationCap className="size-5 shrink-0" />,
              url: "/courses",
            },
          ],
        },
        { title: "Pricing", url: "/pricing" },
        { title: "Help", url: "/help" },
      ];
    }

    // Admin menu
    if (user.role === "admin") {
      return [
        { title: "Home", url: "/" },
        { title: "Dashboard", url: dashboardUrl },
        { title: "Analytics", url: "/admin/analytics" },
        { title: "Users", url: "/admin/users" },
        { title: "Courses", url: "/admin/courses" },
        { title: "Settings", url: "/admin/settings" },
      ];
    }

    return baseMenu;
  };

  // Mobile extra links
  const getMobileExtraLinks = () => {
    if (!user) {
      return [
        { name: "Help", url: "/help" },
        { name: "Terms", url: "/terms" },
        { name: "Privacy", url: "/privacy" },
      ];
    }
    return [];
  };

  return (
    <Navbar1
      logo={{
        url: "/",
        src: "/main-logo.jpeg",
        alt: "English With Evelina",
        title: "English With Evelina",
      }}
      menu={getMenu()}
      mobileExtraLinks={getMobileExtraLinks()}
      auth={{
        login: { text: "Sign In", url: "/auth/login" },
        signup: { text: "Get Started", url: "/auth/register" },
      }}
      userMenu={{
        show: !!user,
        username: user?.username,
        email: user?.email,
        role: user?.role,
        onLogout: handleLogout,
      }}
    />
  );
}
