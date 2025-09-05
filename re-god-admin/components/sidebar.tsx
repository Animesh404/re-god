"use client"

import { Home, Search, Settings, User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function Sidebar() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    router.push("/login")
  }

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
      <div className="w-8 h-8 bg-red-800 rounded flex items-center justify-center mb-8">
        <div className="w-4 h-4 bg-white rounded-sm"></div>
      </div>

      <nav className="flex flex-col space-y-6">
        <div className="flex flex-col items-center space-y-1 text-red-800">
          <Home className="w-5 h-5" />
          <span className="text-xs">Admin</span>
        </div>

        <div className="flex flex-col items-center space-y-1 text-gray-400">
          <Search className="w-5 h-5" />
          <span className="text-xs">Search</span>
        </div>

        <div className="flex flex-col items-center space-y-1 text-gray-400">
          <Settings className="w-5 h-5" />
          <span className="text-xs">Admin</span>
        </div>

        <div className="flex flex-col items-center space-y-1 text-gray-400">
          <User className="w-5 h-5" />
          <span className="text-xs">My</span>
        </div>
      </nav>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex flex-col items-center space-y-1 text-gray-400 hover:text-red-800"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
