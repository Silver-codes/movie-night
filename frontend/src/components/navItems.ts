import type { ComponentType, SVGProps } from 'react'
import { HistoryIcon, PickIcon, SearchIcon, WatchlistIcon } from './NavIcons'

export type NavItem = {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

/** Shared by the desktop top nav and the mobile tab bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/watchlist', label: 'Watchlist', Icon: WatchlistIcon },
  { to: '/pick', label: 'Pick', Icon: PickIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
]
