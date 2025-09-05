import { Link, Database } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function QuickLinks() {
  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-red-800 rounded-lg flex items-center justify-center">
              <Link className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Access Codes</h4>
              <div className="text-sm text-gray-600">Database Access</div>
              <div className="text-xs text-blue-600 mt-1">Login Shortcuts</div>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-red-800 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Total Lessons</h4>
              <div className="text-sm text-gray-600">Track Progress</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">150</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
