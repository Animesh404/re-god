import { Users, BookOpen, Monitor } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function AdminStats() {
  const stats = [
    {
      title: "Teachers Count",
      value: "3",
      icon: BookOpen,
      color: "bg-red-800",
    },
    {
      title: "Total Users",
      value: "20",
      icon: Users,
      color: "bg-red-800",
    },
    {
      title: "Lessons",
      value: "7",
      icon: Monitor,
      color: "bg-red-800",
    },
  ]

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`${stat.color} rounded-lg p-4 mb-2`}>
                <stat.icon className="w-6 h-6 text-white mx-auto" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
