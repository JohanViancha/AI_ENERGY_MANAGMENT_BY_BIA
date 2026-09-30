# SPEC 03 — Dashboard y medidores con datos reales

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02 (y backend SPEC 03 — Contrato de API HTTP)
> **Date:** 2026-09-29
> **Objective:** Reemplazar los `<EmptyState>` de `/`, `/meters` y la nueva ruta `/meters/:meterId` por pantallas que consumen los endpoints de lectura del backend con TanStack Query: KPIs, lista filtrable de los 12 medidores y detalle con gráficos de Recharts y anomalías recientes.

---

## Por qué existe este spec

SPEC 01 dejó el cliente Axios autenticado y SPEC 02 el layout, pero ninguna pantalla llama todavía al backend. Este spec conecta las tres pantallas de datos y fija cómo el frontend consume la API: servicios tipados, hooks de TanStack Query, estados de carga/vacío/error y formateo.

El contrato HTTP ya existe en el repo `AI_ENERGY_API_BY_BIA`, rama `spec-03-contrato-api-http` (backend SPEC 03, estado `Implemented`). Los tipos de este spec se derivan de ese contrato real, no del README. Tres diferencias con lo que el README daba por supuesto condicionan el diseño (ver Decisions): el JSON viaja en `camelCase`, el backend no devuelve un `status` por medidor y no expone baseline.

---

## Scope

**In:**

- Instalar `recharts` y añadir los componentes shadcn `table`, `badge`, `skeleton` y `tabs` en `src/components/ui/`.
- Tipos del contrato en `src/types/` (`meter.ts`, `reading.ts`, `anomaly.ts`, `dashboard.ts`, `api-error.ts`).
- Servicios en `src/services/`: `meters.service.ts`, `anomalies.service.ts` y `dashboard.service.ts`, sobre la instancia `api` de SPEC 01.
- Hooks de TanStack Query en `src/hooks/` (`use-meters.ts`, `use-meter.ts`, `use-meter-readings.ts`, `use-meter-anomalies.ts`, `use-dashboard-summary.ts`) y una fábrica de query keys (`src/lib/query-keys.ts`).
- Endpoints consumidos (todos `GET`, con `Bearer <idToken>` vía el interceptor de SPEC 01):
  - `/dashboard/summary`
  - `/meters`
  - `/meters/:meterId`
  - `/meters/:meterId/readings?from&to&limit`
  - `/anomalies?analysisId&meterId`
- **Dashboard (`/`):** 6 tarjetas KPI (medidores, consumo actual total, anomalías detectadas, prioridad alta, confianza IA, último análisis) y un panel con anomalías por severidad y por tipo.
- **Lista (`/meters`):** tabla con los medidores, filtro por estado (Todos / Normales / Alertas / Críticos con conteo), búsqueda por `meterId`, orden por columna, y filtros/búsqueda/orden en query params de la URL. La fila navega a `/meters/:meterId`.
- **Detalle (`/meters/:meterId`):**
  - tarjetas de resumen (estado, última lectura, consumo, anomalías abiertas, total de lecturas);
  - selector de rango 24 h / 7 d / 14 d;
  - gráfico de consumo (kWh) con las ventanas de anomalía sombreadas;
  - gráficos separados de voltaje, corriente y factor de potencia;
  - las 5 anomalías más recientes en solo lectura.
- Ruta `/meters/:meterId` bajo `ProtectedRoute` → `AppLayout`.
- Estado de un medidor (`OK` / `ALERT` / `CRITICAL`) derivado en el frontend de los contadores del backend.
- Formateo de números y fechas en `src/lib/format.ts` (locale `es-CO`).
- Estados de carga con `Skeleton`, estados vacíos con `EmptyState` y estados de error con `ErrorState` (nuevo, en `src/components/shared/`).
- Errores de red o del backend con toast de sonner, vía un `QueryCache.onError` global en `query-client.ts`.
- Tests unitarios (servicios, formateo, derivación de estado, filtro/orden, componentes clave y toast global). Sin MSW: los tests mockean `@/services/*` o `@/lib/axios`.
- Actualizar README y CLAUDE.md.

**Out of scope (para futuros specs):**

- Run AI Analysis, `POST /ai/analyze` y el progreso de la corrida (SPEC 04).
- Lista de anomalías (`/anomalies`) y la pantalla de investigación (`/anomalies/:id`). `AnomaliesPage` sigue como placeholder (SPEC 04).
- Enlace desde las anomalías recientes del detalle a la investigación. Son solo lectura hasta SPEC 04.
- Baseline en los gráficos (línea de baseline o comparación actual vs baseline). El backend no lo expone; queda para cuando exista un endpoint.
- Datos mock en tiempo de ejecución, flag `VITE_USE_MOCKS` y MSW.
- Endpoints de escritura, cambios de estado de anomalías y roles.
- Paginación de lecturas más allá de una página: los rangos máximos (14 d ≈ 336 puntos) caben en `limit=500`.
- Filtrado, búsqueda y orden en el servidor; se hacen en el cliente.
- Histórico de KPIs o tendencias entre corridas (el backend solo resume la última corrida `COMPLETED`).
- Auto-refresco (polling) del dashboard y tema oscuro.
- Exportar datos y comparar medidores.

---

## Data model

Este spec no introduce datos persistentes, ni estado global nuevo, ni nada en `localStorage`. La caché la gestiona TanStack Query en memoria, que ya se vacía al cerrar sesión (SPEC 01). Los tipos reflejan el JSON del backend tal cual (`camelCase`), sin capa de mapeo.

```ts
// src/types/meter.ts
export interface MeterSummary {
  meterId: string
  lastReadingAt: string | null // ISO 8601
  lastConsumptionKwh: number | null
  openAnomaliesCount: number
  highSeverityOpenCount: number
}

export interface MeterDetail extends MeterSummary {
  totalReadingsCount: number
  lastAnalysisId: string | null
  anomaliesByType: Record<string, number>
}

// Derivado en el frontend, el backend no lo devuelve.
export type MeterStatus = 'OK' | 'ALERT' | 'CRITICAL'
```

```ts
// src/types/reading.ts
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
```

```ts
// src/types/anomaly.ts
export type AnomalyType =
  | 'REAL_ANOMALY'
  | 'EXPLAINABLE_ANOMALY'
  | 'FALSE_POSITIVE'
  | 'DATA_QUALITY'
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type AnomalyStatus = 'OPEN' | 'REVIEWED' | 'RESOLVED'

export interface AnomalyEvidence {
  baselineKwh: number
  observedKwh: number
  variationPct: number
  signals: string[]
  windowStart: string
  windowEnd: string
  relatedEvents: string[]
  detectorScores: Record<string, number>
}

export interface Anomaly {
  id: string
  meterId: string
  analysisId: string
  detectedAt: string
  type: AnomalyType
  severity: AnomalySeverity
  confidence: number // 0.0 - 1.0
  priorityScore: number
  status: AnomalyStatus
  reason: string | null
  recommendedAction: string | null
  evidence: AnomalyEvidence
}
```

```ts
// src/types/dashboard.ts
export interface DashboardSummary {
  analysisId: string | null // null si nunca corrió una corrida COMPLETED
  finishedAt: string | null
  anomaliesCount: number
  bySeverity: { HIGH: number; MEDIUM: number; LOW: number }
  byType: Record<string, number>
  avgConfidence: number | null // 0.0 - 1.0
}
```

```ts
// src/types/api-error.ts
export interface ApiErrorResponse {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
}
```

```ts
// src/lib/query-keys.ts
export const queryKeys = {
  dashboardSummary: ['dashboard', 'summary'] as const,
  meters: ['meters'] as const,
  meter: (meterId: string) => ['meters', meterId] as const,
  meterReadings: (meterId: string, from: string, to: string) =>
    ['meters', meterId, 'readings', { from, to }] as const,
  meterAnomalies: (meterId: string, analysisId: string) =>
    ['anomalies', { meterId, analysisId }] as const,
}
```

```ts
// src/components/meters/meter-status.ts
// CRITICAL si highSeverityOpenCount > 0; ALERT si openAnomaliesCount > 0; si no, OK.
export function getMeterStatus(meter: MeterSummary): MeterStatus

// src/components/meters/meter-list-params.ts
export type MeterSortKey = 'meterId' | 'lastConsumptionKwh' | 'openAnomaliesCount' | 'lastReadingAt'
export type MeterStatusFilter = 'ALL' | MeterStatus
export interface MeterListParams {
  status: MeterStatusFilter // default 'ALL'
  q: string // default ''
  sort: MeterSortKey // default 'meterId'
  dir: 'asc' | 'desc' // default 'asc'
}
// Query params de la URL: /meters?status=CRITICAL&q=M-10&sort=lastConsumptionKwh&dir=desc
// Un valor inválido en la URL cae al default; no rompe la pantalla.
export function applyMeterListParams(meters: MeterSummary[], params: MeterListParams): MeterSummary[]
```

```ts
// src/pages/meter-detail/meter-ranges.ts
export type MeterRange = '24h' | '7d' | '14d' // default '7d'
// El rango se ancla en MeterDetail.lastReadingAt, no en la fecha actual:
// el dataset sembrado termina en septiembre de 2026 y "ahora" no tendría lecturas.
// to = lastReadingAt; from = to - rango; limit = 500.
```

Convenciones:

- Archivos nuevos en `kebab-case`, una exportación principal por archivo, imports de solo tipos con `import type`.
- Textos de UI en español. Etiquetas de estado: OK → "Normal", ALERT → "Alerta", CRITICAL → "Crítico".
- Etiquetas de severidad: LOW → "Baja", MEDIUM → "Media", HIGH → "Alta".
- Etiquetas de tipo:

  | Tipo | Etiqueta |
  | ---- | -------- |
  | `REAL_ANOMALY` | "Anomalía real" |
  | `EXPLAINABLE_ANOMALY` | "Explicable" |
  | `FALSE_POSITIVE` | "Falso positivo" |
  | `DATA_QUALITY` | "Calidad de datos" |

- Formato (`src/lib/format.ts`, `Intl` con `es-CO`):
  - `formatKwh(n)` → `1.234,5 kWh`;
  - `formatNumber(n, digits)`;
  - `formatPercent(0.87)` → `87 %`;
  - `formatDateTime(iso)` → fecha y hora en la zona horaria del navegador;
  - `formatRelative(iso)` para "hace 3 h" (solo en tarjetas);
  - los `null` se muestran como `—`.
- Estados de carga y error:
  - cada bloque de datos independiente (KPI, tabla, gráfico, anomalías) tiene su propio `Skeleton` y su propio `ErrorState`, para que el fallo de uno no bloquee al resto;
  - el `ErrorState` ofrece "Reintentar" (`refetch`).
- Toast global en `query-client.ts`:
  - un `QueryCache.onError` muestra `toast.error` con el `message` de `ApiErrorResponse` (o un texto genérico);
  - no muestra toast ante un 401 (el interceptor de SPEC 01 ya cierra sesión);
  - no muestra toast ante un 404 del detalle (la pantalla lo resuelve con un `EmptyState`);
  - solo muestra toast si la query falla sin datos en caché (`query.state.data === undefined`), para no avisar de refetch en segundo plano.
- Defaults de `QueryClient`: `staleTime: 60_000` y `retry: 1`, sin reintento en 4xx.

---

## Implementation plan

Cada paso deja el proyecto compilando (`npm run build`) y arrancando (`npm run dev`).

1. **Dependencias y componentes base.** Instalar `recharts`. Añadir `src/components/ui/table.tsx`, `badge.tsx`, `skeleton.tsx` y `tabs.tsx` (CLI de shadcn o a mano, según `components.json`, Tailwind v3). Verificación: `npm run build` pasa.
2. **Tipos, query keys y servicios.** Crear `src/types/*`, `src/lib/query-keys.ts` y los tres servicios (`getMeters`, `getMeter`, `getMeterReadings`, `getAnomalies`, `getDashboardSummary`). Cada uno devuelve `response.data` tipado. Tests con `@/lib/axios` mockeado: ruta y params correctos, p. ej. `from`, `to` y `limit=500`. Verificación: `npm run test` pasa.
3. **Formateo.** Crear `src/lib/format.ts` y `format.test.ts` (números, porcentaje, fecha, relativo y `null` → `—`). Verificación: `npm run test` pasa.
4. **Errores globales y estados compartidos.** Configurar `QueryCache.onError` y los defaults en `query-client.ts`, con test (toast con el mensaje del backend; sin toast en 401, en 404 ni con datos en caché). Crear `src/components/shared/error-state.tsx` con su test (mensaje + "Reintentar" llama a `onRetry`). Verificación: `npm run test` pasa.
5. **Hooks.** Crear los cinco hooks sobre los servicios. `useMeterReadings` recibe `{ meterId, from, to }`. `useMeterAnomalies` tiene `enabled: !!analysisId` y se apoya en `MeterDetail.lastAnalysisId`. Verificación: `npm run build` pasa; los hooks se ejercitan en los tests de las pantallas.
6. **Estado del medidor y badges.** Crear `meter-status.ts` (+ test de los tres casos y de los bordes con contadores en 0), `meter-status-badge.tsx`, `severity-badge.tsx` y `anomaly-type-badge.tsx` (+ test de etiquetas). Verificación: `npm run test` pasa.
7. **Dashboard.** Crear `components/dashboard/kpi-card.tsx` y `summary-panel.tsx`, y reemplazar `DashboardPage`:
   - con `useMeters` y `useDashboardSummary`, muestra las 6 tarjetas y el panel;
   - `analysisId === null` → `EmptyState` "Aún no hay análisis" en las tarjetas de anomalías, sin error;
   - Skeleton mientras carga y `ErrorState` con "Reintentar" si falla.

   Verificación: `dashboard-page.test.tsx` con servicios mockeados (datos, `analysisId: null`, carga, error).
8. **Lista de medidores.** Crear `meter-list-params.ts` (+ test de `applyMeterListParams`: filtro, búsqueda sin distinguir mayúsculas, orden asc/desc, `null` al final, parámetros inválidos → defaults), `meter-filters.tsx` (tabs de estado con conteo + búsqueda) y `meter-table.tsx` (encabezados ordenables con `aria-sort`, fila que enlaza al detalle, operable con teclado). Reemplazar `MetersPage` leyendo/escribiendo `useSearchParams`. Con el filtro sin coincidencias, muestra `EmptyState` "Ningún medidor coincide" con acción "Limpiar filtros". Verificación: `meters-page.test.tsx` (12 filas, filtro, búsqueda, orden, URL, vacío, carga y error).
9. **Gráficos.** Crear `components/charts/consumption-chart.tsx` (línea de kWh con `ReferenceArea` por cada ventana de anomalía) y `metric-chart.tsx` (línea genérica para voltaje, corriente y factor de potencia). Reglas comunes:
   - ejes y tooltip con `format.ts`;
   - `ResponsiveContainer` y alto fijo;
   - el tooltip incluye el `status` de la lectura;
   - colores desde tokens del tema, no hardcodeados;
   - una serie vacía renderiza un `EmptyState`.

   Verificación: revisión manual en `npm run dev`; test de que renderiza el `EmptyState` con `data=[]`.
10. **Detalle y ruta.** Crear `src/pages/meter-detail/meter-detail-page.tsx` y `meter-ranges.ts`.
    - Con `useParams`, `useMeter`, `useMeterReadings` (rango anclado en `lastReadingAt`) y `useMeterAnomalies`, muestra las tarjetas de resumen, el selector de rango, los 4 gráficos y las 5 anomalías recientes (tabla con `SeverityBadge`, `AnomalyTypeBadge`, confianza, fecha y `reason`).
    - 404 → `EmptyState` "Medidor no encontrado" con enlace a `/meters`.
    - `lastAnalysisId === null` → "Este medidor aún no tiene análisis".
    - `lastReadingAt === null` → "Sin lecturas".

    Añadir `/meters/:meterId` al router bajo `AppLayout`. Verificación: `meter-detail-page.test.tsx` (datos, 404, sin análisis, sin lecturas, cambio de rango recalcula `from`).
11. **Documentación.** Actualizar el README:
    - estructura: `services/`, `hooks/`, `components/{dashboard,meters,charts,anomalies}/`, `pages/meter-detail/`;
    - prerrequisito: backend con la rama `spec-03-contrato-api-http` (o ya fusionada), datos sembrados, `npm run analyze` ejecutado y el origen del frontend en `CORS_ORIGIN`.

    Actualizar el CLAUDE.md: Recharts instalado, servicios/hooks existen, `DashboardPage`, `MetersPage` y `MeterDetailPage` son reales, `AnomaliesPage` sigue como placeholder.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores de tipos ni de bundling.
- [ ] `npm run lint` termina sin errores.
- [ ] `npm run test` pasa e incluye tests de servicios, `format`, `getMeterStatus`, `applyMeterListParams`, `ErrorState`, el toast global y las tres pantallas.
- [ ] Con el backend levantado, sembrado y con un análisis `COMPLETED`, `/` muestra las 6 tarjetas KPI con valores del backend, y "Anomalías detectadas" coincide con `GET /dashboard/summary`.
- [ ] Con el backend sin ninguna corrida `COMPLETED`, `/` muestra el `EmptyState` "Aún no hay análisis" y no muestra toast de error.
- [ ] `/meters` lista los 12 medidores (M-101 a M-112) con su estado (Normal/Alerta/Crítico).
- [ ] Un medidor con `highSeverityOpenCount > 0` se muestra como Crítico; uno con solo `openAnomaliesCount > 0`, como Alerta; el resto, como Normal.
- [ ] El filtro "Críticos" muestra solo los Críticos, y el conteo de cada tab coincide con las filas que produce.
- [ ] Buscar `m-10` (minúsculas) deja los medidores cuyo `meterId` contiene `M-10`.
- [ ] Pulsar un encabezado ordena la tabla; pulsarlo de nuevo invierte el orden y `aria-sort` refleja el estado.
- [ ] Estado, búsqueda y orden se reflejan en la URL, y recargar `/meters?status=CRITICAL&q=M-1` restaura la misma vista.
- [ ] Un `status` inválido en la URL cae a "Todos" sin error.
- [ ] Una búsqueda sin resultados muestra "Ningún medidor coincide" y "Limpiar filtros" restablece la lista.
- [ ] Pulsar una fila (o Enter sobre ella) navega a `/meters/:meterId`, y el breadcrumb muestra "Dashboard / Medidores / M-109".
- [ ] `/meters/M-109` muestra el resumen, los 4 gráficos (consumo, voltaje, corriente y factor de potencia) y las anomalías recientes de la última corrida de ese medidor.
- [ ] El selector 24 h / 7 d / 14 d cambia el rango de los 4 gráficos, anclado en la última lectura del medidor.
- [ ] El gráfico de consumo sombrea la ventana de cada anomalía del medidor.
- [ ] Las anomalías recientes son solo lectura: sin enlace ni botón de investigación.
- [ ] `/meters/M-999` (inexistente) muestra "Medidor no encontrado" con enlace a `/meters`, sin toast.
- [ ] Mientras cargan los datos, cada bloque muestra un `Skeleton` y no hay saltos de layout al llegar los datos.
- [ ] Con el backend apagado, `/meters` muestra `ErrorState` con "Reintentar" y un toast de error; al volver el backend, "Reintentar" carga la lista.
- [ ] Un fallo en `GET /meters/:meterId/readings` no impide ver el resumen ni las anomalías del detalle.
- [ ] Un 401 no muestra toast y el usuario queda en `/login` (interceptor de SPEC 01).
- [ ] Los números y fechas se formatean con `es-CO` y los `null` se muestran como `—`.
- [ ] Las tablas, los tabs y el selector de rango son operables con teclado y los gráficos tienen un `aria-label` descriptivo.
- [ ] `/anomalies` sigue mostrando su placeholder y no hay ninguna llamada a `POST /ai/analyze`.
- [ ] `npm run build` no incluye ninguna referencia a datos mock ni a `VITE_USE_MOCKS`.

Prerrequisito de la verificación manual: backend de `AI_ENERGY_API_BY_BIA` en la rama `spec-03-contrato-api-http` (o fusionada), Firestore sembrado con `npm run seed`, `npm run analyze` ejecutado una vez, `CORS_ORIGIN` con el origen de Vite (`http://localhost:5173`) y `VITE_API_BASE_URL` apuntando al backend.

---

## Decisions

- **Sí:** consumir el contrato real del backend (rama `spec-03-contrato-api-http`) y tipar el JSON tal cual viaja. Es la fuente de verdad implementada; se descartó basarse en el README del frontend, que lo describía de forma aproximada.
- **Sí:** `camelCase` en los tipos. Se pidió `snake_case` (estándar global de campos de API), pero el backend implementado serializa `camelCase` (`meterId`, `consumptionKwh`). Adaptarse al backend evita una capa de mapeo; cambiarlo a `snake_case` es un cambio del backend fuera de este spec.
- **Sí:** derivar `MeterStatus` en el frontend (`getMeterStatus`) a partir de `openAnomaliesCount` y `highSeverityOpenCount`. Se pidió usar el `status` que el backend "ya devuelve" (`OK | ALERT | CRITICAL`), pero `GET /meters` no lo incluye: `MeterSummary` solo trae los contadores. Se mantienen los mismos valores y etiquetas. Si el backend lo añade después, `getMeterStatus` se sustituye por el campo.
- **Sí:** sin mocks en tiempo de ejecución, sin flag y sin MSW. La app siempre habla con el backend real, así que el contrato ya implementado hace innecesaria una capa paralela. Los tests mockean `@/services/*` o `@/lib/axios`; MSW solo se reconsideraría si un spec futuro necesitara tests de integración a nivel HTTP.
- **Sí:** filtro, búsqueda y orden en el cliente con una función pura (`applyMeterListParams`). El backend devuelve los 12 medidores en una llamada y no pagina (`GET /meters` fuera de paginación por diseño). Es instantáneo y fácil de probar.
- **Sí:** filtros, búsqueda y orden en query params. Sobreviven a la recarga, se comparten y permiten volver desde el detalle a la misma vista.
- **Sí:** gráficos de consumo + variables eléctricas (voltaje, corriente y factor de potencia), sin línea de baseline. Se eligió esa opción, que incluía baseline superpuesto, pero el backend solo entrega `baselineKwh` dentro de la evidencia de cada anomalía, no una serie de baseline. En su lugar se sombrean las ventanas de anomalía en el gráfico de consumo. La línea de baseline queda para cuando exista un endpoint.
- **Sí:** rango anclado en `lastReadingAt` y no en la fecha actual. El dataset sembrado termina en septiembre de 2026; un rango relativo a "hoy" mostraría gráficos vacíos.
- **Sí:** una sola página de lecturas (`limit=500`) con rangos de hasta 14 d (≈336 puntos horarios). Evita implementar paginación por cursor sin necesidad; si se amplían los rangos, se añade con `useInfiniteQuery`.
- **Sí:** las anomalías recientes salen de `GET /anomalies?analysisId=<lastAnalysisId>&meterId=<id>`. El backend exige `analysisId` y `MeterDetail.lastAnalysisId` lo proporciona, por lo que solo se ven las anomalías de la última corrida de ese medidor. Se muestran las 5 más recientes por `detectedAt`, ordenadas en el cliente.
- **Sí:** los KPIs "Medidores" y "Consumo actual total" se calculan en el cliente sobre `GET /meters` (cuenta y suma de `lastConsumptionKwh`, ignorando `null`). El resto viene de `GET /dashboard/summary`. Se etiqueta "Consumo actual" (suma de las últimas lecturas), no "consumo del período", porque el backend no agrega consumo.
- **Sí:** toast global por `QueryCache.onError`, con las exclusiones 401/404/datos en caché, más `ErrorState` en línea. Centraliza la regla y evita un `toast()` disperso por cada hook; el `ErrorState` da el "Reintentar" sin depender del toast, que desaparece.
- **Sí:** `es-CO` para `Intl`. Los textos de UI están en español y el proyecto se opera desde Colombia; es una constante en `format.ts`, fácil de cambiar.
- **Sí:** crear `severity-badge.tsx` y `anomaly-type-badge.tsx` (previstos en el README bajo `components/anomalies/`) ahora, porque el detalle los necesita. SPEC 04 los reutiliza.
- **No:** líneas de baseline, `baseline-comparison-chart.tsx` y comparación actual vs baseline. Sin datos en el contrato (ver arriba).
- **No:** paginación de la lista de medidores ni virtualización. Son 12 filas.
- **No:** polling del dashboard. No se pidió y `staleTime` + refetch al recuperar el foco bastan; SPEC 04 añade el polling del análisis.
- **No:** Zustand para estado del servidor o de filtros. TanStack Query y la URL ya cubren ambos.
- **No:** enlace de anomalía → investigación en el detalle. Su destino no existe hasta SPEC 04, y un botón deshabilitado sería un marcador sin uso.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| El backend SPEC 03 vive en una rama sin fusionar en `main`; sin ella no hay endpoints y no se puede verificar a mano. | Documentarlo como prerrequisito (README y criterios de aceptación). Este spec no se marca `Implementado` hasta verificarlo contra el backend real. |
| CORS: el backend lee `CORS_ORIGIN`; si no incluye `http://localhost:5173`, el navegador bloquea las llamadas. | Está en el prerrequisito de verificación. El `ErrorState` y el toast hacen visible el fallo en vez de una pantalla en blanco. |
| El contrato cambia (p. ej. el backend añade `status` o pasa a `snake_case`). | Los tipos están centralizados en `src/types/` y el estado en `getMeterStatus`, así que el cambio queda acotado a esos archivos y a los servicios. |
| Sin `analysisId` (`lastAnalysisId: null`) no se pueden pedir anomalías del medidor. | Estado vacío explícito "Este medidor aún no tiene análisis", con `enabled: false` en la query. |
| `GET /meters` hace N+1 queries en el backend (riesgo aceptado allí para ~12 medidores). | Sin acción en el frontend; `staleTime` de 60 s reduce las llamadas repetidas. |
| Lecturas `INVALID` o `ESTIMATED` (p. ej. M-112, calidad de datos) pueden distorsionar los gráficos. | Se grafican tal cual y el tooltip muestra el `status` de la lectura. Ocultarlas o marcarlas visualmente queda para otro spec. |
| jsdom no renderiza Recharts con tamaño real (`ResponsiveContainer` mide 0). | Los tests de los gráficos solo comprueban el estado vacío y las etiquetas accesibles; el render real se verifica a mano en `npm run dev`. |
| Zona horaria: los timestamps son ISO en UTC y el navegador los muestra en local. | `formatDateTime` usa la zona del navegador de forma explícita; los tests fijan `TZ` para que sean deterministas. |
| El detalle de un medidor lanza 3 requests (detalle, lecturas, anomalías); un fallo parcial deja la pantalla a medias. | Cada bloque tiene su propio `Skeleton` y `ErrorState`, y el toast global cubre los fallos sin bloquear el resto. |

---

## What is **not** in this spec

- Run AI Analysis, `POST /ai/analyze` y su progreso.
- Lista de anomalías `/anomalies` y pantalla de investigación `/anomalies/:id`.
- Enlace de las anomalías recientes a la investigación.
- Baseline en los gráficos.
- Mocks en tiempo de ejecución, flag `VITE_USE_MOCKS` y MSW.
- Paginación de lecturas más allá de una página y filtrado del lado del servidor.
- Polling, histórico de KPIs y tendencias entre corridas.
- Escrituras contra el backend, roles y exportación de datos.

Cada uno de estos puntos, si se hace, va en su propio spec.
