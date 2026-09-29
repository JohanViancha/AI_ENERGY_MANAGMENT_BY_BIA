import { createBrowserRouter } from 'react-router-dom'

import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { LoginPage } from '@/pages/login/login-page'
import { NotFoundPage } from '@/pages/not-found/not-found-page'
import { ProtectedRoute } from '@/router/protected-route'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <DashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
])
