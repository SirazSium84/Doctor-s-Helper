import { Stethoscope } from "lucide-react"

export function Header() {
  return (
    <header className="bg-gradient-to-r from-slate-800/95 to-gray-800/95 border-b border-gray-700/60 shadow-2xl backdrop-blur-sm px-6 py-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-lg shadow-lg">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Patient Assessment Dashboard</h1>
          <p className="text-gray-400 text-sm">Healthcare Provider Analytics Platform</p>
        </div>
      </div>
    </header>
  )
}
