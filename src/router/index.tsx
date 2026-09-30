import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { AnomaliesPage } from '@/pages/anomalies/anomalies-page'
import { AnomalyDetailPage } from '@/pages/anomaly-detail/anomaly-detail-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { LoginPage } from '@/pages/login/login-page'
import { MeterDetailPage } from '@/pages/meter-detail/meter-detail-page'
import { MetersPage } from '@/pages/meters/meters-page'
import { NotFoundPage } from '@/pages/not-found/not-found-page'
import { ProtectedRoute } from '@/router/protected-route'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/meters', element: <MetersPage /> },
          { path: '/meters/:meterId', element: <MeterDetailPage /> },
          { path: '/anomalies', element: <AnomaliesPage /> },
          { path: '/anomalies/:id', element: <AnomalyDetailPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
