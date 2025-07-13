"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface NavigationTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function NavigationTabs({ tabs, activeTab, onTabChange }: NavigationTabsProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900/90 to-gray-900/90 border-b border-gray-700/60 shadow-2xl backdrop-blur-sm rounded-b-xl">
      <div className="px-6">
        <nav className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700/60 scrollbar-track-transparent py-2 pl-2">
          {tabs.map((tab, idx) => (
            <div key={tab.id} className={cn(idx === 0 && 'ml-1')}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "btn btn-ghost flex items-center space-x-2 py-3 px-4 text-base whitespace-nowrap rounded-lg transition-all duration-300",
                  activeTab === tab.id && "bg-gradient-to-r from-teal-600/30 to-cyan-600/30 border border-teal-400/40 shadow-lg text-white scale-[1.04] pl-6 rounded-l-3xl",
                  !activeTab === tab.id && "hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-slate-700/50 hover:shadow-md"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
