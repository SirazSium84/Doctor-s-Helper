import { Activity } from "lucide-react"

export function Header() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Patient Assessment Dashboard</h1>
          <p className="text-gray-400 text-sm">Healthcare Provider Analytics Platform</p>
        </div>
      </div>
    </header>
  )
}
