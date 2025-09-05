import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function TeachersDirectory() {
  const teachers = [
    { name: "John Smith", avatar: "/placeholder.svg?height=32&width=32" },
    { name: "Jane Doe", avatar: "/placeholder.svg?height=32&width=32" },
  ]

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Teachers Directory</h3>
        <div className="space-y-3">
          {teachers.map((teacher, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={teacher.avatar || "/placeholder.svg"} alt={teacher.name} className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium text-gray-900">{teacher.name}</span>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4 text-sm text-gray-600">
          View All
        </Button>
        <div className="flex space-x-2 mt-4">
          <Button variant="outline" className="flex-1 text-sm bg-white text-gray-700 border-gray-300">
            Find Teachers
          </Button>
          <Button className="flex-1 text-sm bg-red-800 hover:bg-red-900">Invite Admins</Button>
        </div>
      </CardContent>
    </Card>
  )
}
