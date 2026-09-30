import { api } from '@/lib/axios'
import type { MeterDetail, MeterSummary } from '@/types/meter'
import type { PaginatedReadings } from '@/types/reading'

export const READINGS_PAGE_LIMIT = 500

export interface MeterReadingsParams {
  from: string
  to: string
  limit?: number
}

/** Lista los medidores con sus contadores de anomalías abiertas. */
export async function getMeters(): Promise<MeterSummary[]> {
  const response = await api.get<MeterSummary[]>('/meters')
  return response.data
}

/** Devuelve el detalle de un medidor; el backend responde 404 si no existe. */
export async function getMeter(meterId: string): Promise<MeterDetail> {
  const response = await api.get<MeterDetail>(`/meters/${encodeURIComponent(meterId)}`)
  return response.data
}

/** Devuelve una sola página de lecturas del rango indicado (sin paginación por cursor). */
export async function getMeterReadings(
  meterId: string,
  { from, to, limit = READINGS_PAGE_LIMIT }: MeterReadingsParams,
): Promise<PaginatedReadings> {
  const response = await api.get<PaginatedReadings>(
    `/meters/${encodeURIComponent(meterId)}/readings`,
    { params: { from, to, limit } },
  )
  return response.data
}
