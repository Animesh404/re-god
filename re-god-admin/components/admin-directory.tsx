import { Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminDirectory() {
  const admins = [
    { name: "John Smith", avatar: "/placeholder.svg?height=32&width=32" },
    { name: "Jane Doe", avatar: "/placeholder.svg?height=32&width=32" },
  ]

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Directory</h3>
        <div className="space-y-3">
          {admins.map((admin, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={admin.avatar || "/placeholder.svg"} alt={admin.name} className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium text-gray-900">{admin.name}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4 text-sm text-gray-600">
          View All
        </Button>
      </CardContent>
    </Card>
  )
}
