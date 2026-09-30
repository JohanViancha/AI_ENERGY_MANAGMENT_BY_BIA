export type ReadingStatus = 'OK' | 'ESTIMATED' | 'INVALID'

export interface Reading {
  meterId: string
  timestamp: string // ISO 8601, granularidad horaria
  consumptionKwh: number
  voltage: number
  current: number
  powerFactor: number
  status: ReadingStatus
}

export interface PaginatedReadings {
  data: Reading[]
  nextCursor: string | null
}
