import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { PageLoading } from './components/PageLoading'

// Each page is its own chunk, loaded when its route is first visited.
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    // Shown inside nothing while the first page's chunk loads.
    hydrateFallbackElement: <PageLoading />,
    children: [
      { index: true, element: <Navigate to="/watchlist" replace /> },
      { path: 'search', lazy: async () => ({ Component: (await import('./pages/SearchPage')).SearchPage }) },
      { path: 'watchlist', lazy: async () => ({ Component: (await import('./pages/WatchlistPage')).WatchlistPage }) },
      { path: 'pick', lazy: async () => ({ Component: (await import('./pages/PickPage')).PickPage }) },
      { path: 'history', lazy: async () => ({ Component: (await import('./pages/HistoryPage')).HistoryPage }) },
      { path: '*', lazy: async () => ({ Component: (await import('./pages/NotFoundPage')).NotFoundPage }) },
    ],
  },
])
