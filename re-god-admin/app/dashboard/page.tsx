"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AdminProfile } from "@/components/admin-profile"
import { AdminStats } from "@/components/admin-stats"
import { QuickLinks } from "@/components/quick-links"
import { AdminDirectory } from "@/components/admin-directory"
import { TeachersDirectory } from "@/components/teachers-directory"

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    if (!authStatus) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">New Screen</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <AdminProfile />
              <AdminStats />
              <QuickLinks />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AdminDirectory />
              <TeachersDirectory />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
