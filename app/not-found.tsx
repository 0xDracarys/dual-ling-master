export const dynamic = 'force-dynamic';

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-indigo-600 mb-4 animate-pulse">
            404
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Oops! The page you're looking for seems to have wandered off into the digital void. 
            Don't worry, even the best language learners sometimes take a wrong turn!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="w-full sm:w-auto btn-primary">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto btn-outline-primary">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>
          
          <div className="pt-4">
            <Button asChild variant="outline" className="btn-outline-primary">
              <Link href="/courses">
                <Search className="w-4 h-4 mr-2" />
                Browse Language Courses
              </Link>
            </Button>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/courses" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              All Courses
            </Link>
            <Link href="/about" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Contact
            </Link>
            <Link href="/help" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Help Center
            </Link>
          </div>
        </div>

        {/* Fun Language Learning Tip */}
        <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-800">
            <strong>Language Learning Tip:</strong> When you encounter a "404" in real life, 
            it's like finding a new word you don't know - it's an opportunity to learn something new! 
            Use this moment to explore our language courses and expand your vocabulary.
          </p>
        </div>
      </div>
    </div>
  )
}

