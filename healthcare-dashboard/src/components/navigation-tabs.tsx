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
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="px-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300",
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
