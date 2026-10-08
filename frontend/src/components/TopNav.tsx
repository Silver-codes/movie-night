import { NavLink } from 'react-router'
import { Logo } from './Logo'
import { NAV_ITEMS } from './navItems'
import { PeopleButton } from './PeopleButton'

/** Sticky header: logo and the people button everywhere, nav links from `md` up (mobile uses BottomTabBar). */
export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-ink-800 hover:text-fg'
                    }`
                  }
                >
                  <Icon className="size-4.5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto md:ml-3">
          <PeopleButton />
        </div>
      </div>
    </header>
  )
}
