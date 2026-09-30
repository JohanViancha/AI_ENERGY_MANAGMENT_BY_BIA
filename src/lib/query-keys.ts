export const queryKeys = {
  dashboardSummary: ['dashboard', 'summary'] as const,
  meters: ['meters'] as const,
  meter: (meterId: string) => ['meters', meterId] as const,
  meterReadings: (meterId: string, from: string, to: string) =>
    ['meters', meterId, 'readings', { from, to }] as const,
  meterAnomalies: (meterId: string, analysisId: string) =>
    ['anomalies', { meterId, analysisId }] as const,
}
