import { Outlet } from 'react-router'
import { BackendStatus } from './BackendStatus'
import { BottomTabBar } from './BottomTabBar'
import { PeopleSync } from './PeopleSync'
import { TopNav } from './TopNav'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PeopleSync />
      <TopNav />
      <BackendStatus />
      {/* Bottom padding keeps content clear of the mobile tab bar. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-10 md:pb-16">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
