import type { Metadata } from 'next'
import { Sidebar } from '@/components/dashboard/Sidebar'

export const metadata: Metadata = { title: 'Dashboard — Finmark' }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0B0F1A] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
