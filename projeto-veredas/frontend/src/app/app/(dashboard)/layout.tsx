import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main data-tour="dashboard-content" className="flex-1 overflow-auto bg-surface p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
