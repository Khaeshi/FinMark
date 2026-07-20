'use client'
import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const toggleCollapse = () => setIsCollapsed(c => !c)

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
