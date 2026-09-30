# SPEC 04 — Análisis IA en vivo y anomalías

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02, SPEC 03 (y backend SPEC 03 — Contrato de API HTTP)
> **Date:** 2026-09-29
> **Objective:** Añadir el botón "Run AI Analysis" al Dashboard con el progreso de las 7 fases en vivo vía `onSnapshot` de Firestore, la lista priorizada de anomalías en `/anomalies` con filtros y el expediente de cada anomalía en `/anomalies/:id`.

---

## Por qué existe este spec

SPEC 03 dejó el frontend en modo lectura: `AnomaliesPage` es un placeholder y no hay forma de disparar el motor. Este spec cierra el flujo del README (Run AI Analysis → lista priorizada → investigación → acción recomendada).

Tres hechos del backend condicionan el diseño (ver Decisions):

- Los documentos de Firestore usan `snake_case` (`progress.phase`, `anomalies_count`). `onSnapshot` los devuelve así, mientras que la API HTTP responde en `camelCase`. Hace falta un mapeo explícito en el borde de Firestore.
- El backend no incluye `firestore.rules`. El cliente solo puede suscribirse a `analyses` si las reglas lo permiten, por lo que el progreso en vivo tiene un fallback a polling de `GET /ai/analysis/:id`.
- `evidence.relatedEvents` contiene solo ids de la colección `events` y no hay endpoint de eventos. Por decisión del usuario, el expediente no muestra eventos correlacionados.

---

## Scope

**In:**

- Ampliar `src/lib/firebase.ts` con `export const db = getFirestore(app)`. No requiere dependencias nuevas: `firebase` ya está instalado.
- **Run AI Analysis (Dashboard `/`):**
  - `RunAnalysisButton` que llama a `POST /ai/analyze` (cuerpo `{}`: todos los medidores, parámetros por defecto del backend), con estado deshabilitado mientras hay una corrida `RUNNING`.
  - `AnalysisProgress`: barra de progreso global (`progress.pct`) y las 7 fases (`READINGS` → `RECOMMENDATION`) con estado hecha / en curso / pendiente, actualizadas en vivo.
  - Suscripción con `onSnapshot` al documento `analyses/{analysisId}`, con fallback automático a polling de `GET /ai/analysis/:id` cada 2 s si la suscripción falla (p. ej. `permission-denied`).
  - Persistencia del `analysisId` activo en `sessionStorage` para retomar la suscripción al recargar o volver al Dashboard.
  - Al terminar (`COMPLETED`): invalidar las queries de dashboard, medidores y anomalías para refrescar los datos. Al terminar (`FAILED`): mostrar `errorMessage` y permitir reintentar.
- **Lista (`/anomalies`):**
  - anomalías de la última corrida `COMPLETED` (el `analysisId` sale de `GET /dashboard/summary`), ordenadas por `priorityScore` descendente;
  - filtros por severidad, tipo y medidor, guardados en la URL (`?severity=HIGH&type=REAL_ANOMALY&meterId=M-109`);
  - la fila navega a `/anomalies/:id`.
- **Expediente (`/anomalies/:id`):** cabecera (medidor, badges, `priorityScore`, confianza, estado, fecha), `reason`, evidencia (baseline vs observado, variación, ventana, `signals`, `detectorScores`) y `recommendedAction`.
- Endpoints nuevos consumidos: `POST /ai/analyze`, `GET /ai/analysis/:id` (fallback) y `GET /anomalies/:id`. `GET /anomalies?analysisId` ya existe desde SPEC 03.
- Enlace desde las anomalías recientes del detalle de medidor (SPEC 03) al expediente.
- Tests unitarios (servicios, mapeo de Firestore, hook de análisis, parámetros de la lista, componentes y pantallas). Sin MSW: se mockean `@/services/*`, `@/lib/firebase` y `firebase/firestore`.
- Actualizar README y CLAUDE.md.

**Out of scope (para futuros specs):**

- Deploy y video demo (fuera de alcance por indicación del usuario).
- Eventos correlacionados en el expediente. No hay endpoint de eventos y se decidió no leer `events` desde Firestore.
- Reglas de seguridad de Firestore (`firestore.rules`) y su despliegue: viven en el backend. Aquí solo se documenta la regla requerida.
- Parámetros del análisis en la UI (`meterIds`, `from`, `to`, `windowDays`, `gapHours`). El botón analiza todo con valores por defecto.
- Cancelar una corrida en curso.
- Historial de corridas y selector de `analysisId` en `/anomalies`. Solo se muestra la última corrida `COMPLETED`.
- Transiciones de estado de la anomalía (`OPEN → REVIEWED → RESOLVED`): el backend no expone escritura.
- Filtro por estado de la anomalía (hoy todas son `OPEN` y no hay escritura).
- Descubrir corridas activas iniciadas desde otra pestaña, dispositivo o CLI (`npm run analyze`).
- Paginación de anomalías, orden por otras columnas, búsqueda de texto y exportación.
- Notificaciones push o toast de "análisis terminado" fuera de la pantalla.
- Tema oscuro.

---

## Data model

Este spec no introduce datos persistentes propios. La caché sigue en TanStack Query. La única persistencia del cliente es una clave de `sessionStorage` con el `analysisId` de la corrida activa. Los tipos reflejan el contrato del backend.

```ts
// src/types/analysis.ts
export type AnalysisStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'
export type AnalysisPhase =
  | 'READINGS'
  | 'BASELINE'
  | 'DETECTION'
  | 'CORRELATION'
  | 'EVENTS'
  | 'EXPLANATION'
  | 'RECOMMENDATION'

export interface AnalysisProgress {
  phase: AnalysisPhase
  pct: number // 0-100, progreso global del proceso completo
}

// Forma HTTP (camelCase): POST /ai/analyze y GET /ai/analysis/:id
export interface Analysis {
  id: string
  startedAt: string
  finishedAt: string | null
  status: AnalysisStatus
  errorCode: string | null
  errorMessage: string | null
  triggeredBy: 'MANUAL' | 'SCHEDULED'
  metersAnalyzed: string[]
  progress: AnalysisProgress
  anomaliesCount: number
  highPriorityCount: number
}

export interface StartAnalysisResponse {
  analysisId: string
  status: 'RUNNING'
}

// Forma de Firestore (snake_case): documento analyses/{analysisId}, sin `id`
export interface AnalysisFirestoreDoc {
  started_at: string
  finished_at: string | null
  status: AnalysisStatus
  error_code: string | null
  error_message: string | null
  triggered_by: 'MANUAL' | 'SCHEDULED'
  meters_analyzed: string[]
  progress: { phase: AnalysisPhase; pct: number }
  anomalies_count: number
  high_priority_count: number
}
```

```ts
// src/lib/analysis-phases.ts
// Orden fijo de las 7 fases; el índice decide si una fase está hecha, en curso o pendiente.
export const ANALYSIS_PHASES: { phase: AnalysisPhase; label: string }[] = [
  { phase: 'READINGS', label: 'Carga de lecturas' },
  { phase: 'BASELINE', label: 'Cálculo de baseline' },
  { phase: 'DETECTION', label: 'Detección de anomalías' },
  { phase: 'CORRELATION', label: 'Correlación con eventos' },
  { phase: 'EVENTS', label: 'Clasificación' },
  { phase: 'EXPLANATION', label: 'Explicación' },
  { phase: 'RECOMMENDATION', label: 'Recomendación' },
]
// COMPLETED → las 7 hechas. FAILED → la fase de `progress.phase` queda marcada como fallida.
```

```ts
// src/services/analysis-stream.service.ts
// Único punto que conoce Firestore: mapea snake_case → Analysis (camelCase).
export function mapAnalysisDoc(id: string, doc: AnalysisFirestoreDoc): Analysis
export function subscribeToAnalysis(
  analysisId: string,
  handlers: { onNext: (analysis: Analysis) => void; onError: (error: Error) => void },
): () => void // devuelve unsubscribe; si el documento no existe llama a onError
```

```ts
// src/hooks/use-analysis.ts
export type AnalysisTransport = 'firestore' | 'polling'

export interface UseAnalysisRunResult {
  analysis: Analysis | null
  transport: AnalysisTransport | null
  isStarting: boolean // POST /ai/analyze en vuelo
  isRunning: boolean // analysis?.status === 'RUNNING' o isStarting
  startError: string | null // fallo del POST (400/401/500), mensaje del backend
  start: () => void
}

// sessionStorage: clave 'energy:active-analysis-id' → analysisId de la corrida RUNNING.
// Se escribe al recibir el 202, se borra al llegar a COMPLETED/FAILED o si el documento no existe.
```

```ts
// src/lib/query-keys.ts (se añaden)
anomalies: (analysisId: string) => ['anomalies', { analysisId }] as const,
anomaly: (id: string) => ['anomalies', id] as const,
// Ambas cuelgan del prefijo ['anomalies'], el mismo de meterAnomalies (SPEC 03):
// invalidar ['anomalies'] refresca todas las vistas de anomalías.
```

```ts
// src/components/anomalies/anomaly-list-params.ts
export type SeverityFilter = 'ALL' | AnomalySeverity
export type TypeFilter = 'ALL' | AnomalyType
export interface AnomalyListParams {
  severity: SeverityFilter // default 'ALL'
  type: TypeFilter // default 'ALL'
  meterId: string // default '' (todos)
}
// URL: /anomalies?severity=HIGH&type=REAL_ANOMALY&meterId=M-109
// Un valor inválido en la URL cae al default; no rompe la pantalla.
// Orden fijo: priorityScore desc; empates por detectedAt desc y luego id.
export function applyAnomalyListParams(anomalies: Anomaly[], params: AnomalyListParams): Anomaly[]
```

Servicios nuevos (devuelven `response.data` tipado, sobre la instancia `api` de SPEC 01):

- `src/services/ai.service.ts`: `startAnalysis()` → `POST /ai/analyze` con `{}`; `getAnalysis(id)` → `GET /ai/analysis/:id`.
- `src/services/anomalies.service.ts` (existente): se añade `getAnomaly(id)` → `GET /anomalies/:id`.

Convenciones:

- Archivos nuevos en `kebab-case`, una exportación principal por archivo, imports de solo tipos con `import type`.
- Textos de UI en español; etiquetas de severidad y tipo reutilizadas de SPEC 03 (`SeverityBadge`, `AnomalyTypeBadge`).
- Formato con `src/lib/format.ts` de SPEC 03; los `null` se muestran como `—`.
- `priorityScore` se muestra con `formatNumber(n, 1)` y la confianza con `formatPercent`.
- Componentes nuevos: `components/ai/{run-analysis-button,analysis-progress,evidence-panel}.tsx`, `components/anomalies/{anomaly-table,confidence-indicator,anomaly-filters,anomaly-list-params}`, `pages/anomalies/anomalies-page.tsx` y `pages/anomaly-detail/anomaly-detail-page.tsx`.

---

## Implementation plan

Cada paso deja el proyecto compilando (`npm run build`) y arrancando (`npm run dev`).

1. **Tipos, query keys y servicios HTTP.** Crear `src/types/analysis.ts`, ampliar `query-keys.ts`, crear `ai.service.ts` y añadir `getAnomaly` a `anomalies.service.ts`. Tests con `@/lib/axios` mockeado: `POST /ai/analyze`, `GET /ai/analysis/:id` y `GET /anomalies/:id` con ruta y cuerpo correctos. Verificación: `npm run test` pasa.
2. **Firestore y mapeo.** Exportar `db` desde `src/lib/firebase.ts`. Crear `analysis-stream.service.ts` con `mapAnalysisDoc` y `subscribeToAnalysis` (`onSnapshot` sobre `doc(db, 'analyses', id)`), y `src/lib/analysis-phases.ts`. Tests: `mapAnalysisDoc` convierte `snake_case` a `camelCase`, `subscribeToAnalysis` emite `Analysis`, llama a `onError` si el documento no existe o `onSnapshot` falla, y devuelve el `unsubscribe`. Verificación: `npm run test` pasa.
3. **Hook `useAnalysisRun`.** Crear `src/hooks/use-analysis.ts`:
   - `start()` llama a `startAnalysis`, guarda el id en `sessionStorage` y suscribe;
   - en `onError` de la suscripción cambia a polling de `getAnalysis` cada 2 s (`transport: 'polling'`);
   - al montar retoma el id guardado;
   - al llegar a `COMPLETED` o `FAILED` borra la clave, detiene la suscripción o el polling y, en `COMPLETED`, invalida `['dashboard']`, `['meters']` y `['anomalies']`;
   - un fallo del POST llena `startError`;
   - el cleanup del efecto cancela la suscripción (compatible con StrictMode).

   Tests con servicios mockeados: éxito, cambio a polling, retomar, `FAILED`, error del POST, no duplicar suscripciones. Verificación: `npm run test` pasa.
4. **Componentes de análisis.** Crear `components/ai/analysis-progress.tsx` (barra con `role="progressbar"` y `aria-valuenow`, lista de 7 fases con estado y `aria-current="step"` en la actual, mensaje de error en `FAILED`, indicador discreto "modo polling") y `run-analysis-button.tsx` (deshabilitado con spinner y `aria-busy` mientras `isRunning`). Tests: fases hechas / en curso / pendientes según `progress.phase`, `COMPLETED` marca las 7, `FAILED` muestra `errorMessage`. Verificación: `npm run test` pasa.
5. **Integrar en el Dashboard.** En `DashboardPage`, añadir el botón en la cabecera y `AnalysisProgress` debajo mientras haya corrida activa o resultado reciente. Si `startError` tiene valor, mostrarlo en línea sin toast. Extender `dashboard-page.test.tsx`: el clic dispara `start`, se ve el progreso, el botón queda deshabilitado y los KPI se refrescan al completar. Verificación manual en `npm run dev`: lanzar un análisis real y ver avanzar las 7 fases.
6. **Confianza y lista de anomalías.** Crear `confidence-indicator.tsx`, `anomaly-list-params.ts` (+ test de `applyAnomalyListParams`: orden por `priorityScore` desc y desempates, filtros por severidad, tipo y medidor, valores inválidos → defaults), `anomaly-filters.tsx` (selects de severidad, tipo y medidor, con "Todos" y opciones de medidor derivadas de los datos), `anomaly-table.tsx` (columnas: prioridad, medidor, tipo, severidad, confianza, detectada, acción recomendada truncada; fila enlazada a `/anomalies/:id`, operable con teclado) y el hook `use-anomalies.ts` (`enabled: !!analysisId`). Verificación: `npm run test` pasa.
7. **Pantalla `/anomalies`.** Reemplazar `AnomaliesPage`: `useDashboardSummary` para obtener `analysisId`; `analysisId === null` → `EmptyState` "Aún no hay análisis" con indicación de ir al Dashboard; lista vacía tras filtrar → `EmptyState` "Ninguna anomalía coincide" con "Limpiar filtros". Filtros leídos y escritos con `useSearchParams`. Skeleton al cargar y `ErrorState` con "Reintentar". Verificación: `anomalies-page.test.tsx` (orden, filtros, URL, sin análisis, vacío, carga y error).
8. **Expediente.** Crear `use-anomaly.ts`, `components/ai/evidence-panel.tsx` (baseline vs observado con variación, ventana, lista de `signals`, `detectorScores` como barras con etiqueta numérica) y `pages/anomaly-detail/anomaly-detail-page.tsx` con: cabecera, sección "Qué encontró la IA" (`reason`), evidencia, sección "Acción recomendada" (`recommendedAction`) y enlace al medidor. `reason` o `recommendedAction` en `null` → texto "Sin información disponible". 404 → `EmptyState` "Anomalía no encontrada" con enlace a `/anomalies`. Verificación: `anomaly-detail-page.test.tsx` (datos, campos nulos, 404, error).
9. **Router y enlace desde medidores.** Añadir `/anomalies/:id` bajo `ProtectedRoute` → `AppLayout`. En `recent-anomalies-table.tsx` (SPEC 03) hacer que cada fila enlace a `/anomalies/:id` y ajustar su test. Verificación: navegar Detalle de medidor → expediente muestra el breadcrumb "Dashboard / Anomalías / {id}".
10. **Documentación.** Actualizar el README (estructura, rutas, `firestore.rules` requeridas y el modo polling como fallback) y el CLAUDE.md (`AnomaliesPage` y `AnomalyDetailPage` reales, `ai.service` y `use-analysis` existen, `db` de Firestore en `firebase.ts`, `POST /ai/analyze` solo se llama desde `useAnalysisRun`).

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores de tipos ni de bundling.
- [ ] `npm run lint` termina sin errores.
- [ ] `npm run test` pasa e incluye tests de `ai.service`, `mapAnalysisDoc`/`subscribeToAnalysis`, `useAnalysisRun`, `AnalysisProgress`, `applyAnomalyListParams` y las pantallas `/`, `/anomalies` y `/anomalies/:id`.
- [ ] El Dashboard muestra el botón "Run AI Analysis" y al pulsarlo se hace exactamente una llamada a `POST /ai/analyze` con cuerpo `{}`.
- [ ] Mientras la corrida está `RUNNING` el botón está deshabilitado (`aria-busy`) y un segundo clic no lanza otra corrida.
- [ ] `AnalysisProgress` muestra las 7 fases en el orden `READINGS → RECOMMENDATION` y la barra refleja `progress.pct`.
- [ ] Con las reglas de Firestore correctas, el progreso se actualiza sin recargar y sin polling (ninguna llamada a `GET /ai/analysis/:id`).
- [ ] Si `onSnapshot` falla por permisos, la UI cambia a polling de `GET /ai/analysis/:id` cada 2 s, sigue mostrando el progreso y no muestra toast.
- [ ] Al llegar a `COMPLETED`, las 7 fases quedan marcadas como hechas, el botón se rehabilita y los KPI del Dashboard cambian sin recargar.
- [ ] Al llegar a `FAILED` se muestra `errorMessage`, la fase fallida queda marcada y el botón permite reintentar.
- [ ] Un 4xx/5xx en `POST /ai/analyze` muestra el mensaje del backend en línea, sin corrida activa y con el botón habilitado.
- [ ] Recargar durante una corrida `RUNNING` retoma el progreso; tras `COMPLETED` o `FAILED` una recarga ya no muestra progreso.
- [ ] Salir del Dashboard y volver no crea suscripciones duplicadas (una sola suscripción activa).
- [ ] `/anomalies` lista las anomalías de la última corrida `COMPLETED` ordenadas por `priorityScore` descendente.
- [ ] Filtrar por severidad "Alta" muestra solo anomalías `HIGH`; combinar severidad, tipo y medidor aplica los tres filtros a la vez.
- [ ] Los filtros se reflejan en la URL y recargar `/anomalies?severity=HIGH&meterId=M-109` restaura la misma vista.
- [ ] Un `severity` o `type` inválido en la URL cae a "Todos" sin error.
- [ ] Sin corridas `COMPLETED`, `/anomalies` muestra "Aún no hay análisis" y no muestra toast de error.
- [ ] Un filtro sin resultados muestra "Ninguna anomalía coincide" y "Limpiar filtros" restablece la lista.
- [ ] Pulsar una fila (o Enter sobre ella) navega a `/anomalies/:id`.
- [ ] `/anomalies/:id` muestra `reason`, baseline y observado con su variación, la ventana de tiempo, las `signals`, los `detectorScores` y `recommendedAction`.
- [ ] `/anomalies/:id` no muestra ninguna sección de eventos correlacionados ni hace lecturas a la colección `events`.
- [ ] Un `reason` o `recommendedAction` en `null` muestra "Sin información disponible" sin romper la pantalla.
- [ ] `/anomalies/no-existe` muestra "Anomalía no encontrada" con enlace a `/anomalies`, sin toast.
- [ ] Las anomalías recientes del detalle de medidor enlazan a su expediente.
- [ ] Cada bloque asíncrono tiene su `Skeleton` y su `ErrorState` con "Reintentar"; un 401 no muestra toast.
- [ ] La lista, los filtros y el progreso son operables con teclado; la barra de progreso tiene `role="progressbar"` y las fases exponen su estado en texto, no solo en color.
- [ ] `npm run build` no incluye referencias a datos mock.

Prerrequisito de la verificación manual: backend en la rama `spec-03-contrato-api-http` (o fusionada) con Firestore sembrado, `CORS_ORIGIN` con `http://localhost:5173`, y reglas de Firestore con `allow read: if request.auth != null;` (y `allow write: if false;`) sobre `analyses`. Para verificar el fallback, quitar temporalmente la regla de lectura y confirmar el cambio a polling.

---

## Decisions

- **Sí:** `onSnapshot` sobre `analyses/{id}` para el progreso en vivo, como se pidió. El backend descartó SSE/WebSockets, pero Firestore ya es el almacén del `Analysis` y el motor actualiza el documento fase por fase.
- **Sí:** fallback automático a polling de `GET /ai/analysis/:id` cada 2 s. El backend no incluye reglas de Firestore, así que la suscripción puede fallar por `permission-denied`; el fallback evita una demo rota. Se descartó "solo prerrequisito" por ese riesgo y "solo polling" porque contradice lo pedido.
- **Sí:** mapear `snake_case → camelCase` una sola vez en `mapAnalysisDoc`, dentro de `analysis-stream.service.ts`. El resto de la app solo ve `Analysis` en `camelCase`, igual que el JSON de la API (SPEC 03).
- **Sí:** persistir el `analysisId` activo en `sessionStorage` (`energy:active-analysis-id`). Permite retomar tras recargar y evita lanzar una segunda corrida por error. Se descartó consultar `analyses where status == RUNNING` porque exige otra regla, otro índice y otra query, y el caso multi-pestaña no es un requisito. `sessionStorage` y no `localStorage` para que una clave obsoleta no sobreviva entre sesiones del navegador.
- **Sí:** `POST /ai/analyze` con cuerpo `{}`. Analiza los 12 medidores con los valores por defecto del backend. Los parámetros (`meterIds`, `from`, `to`…) son otro spec.
- **Sí:** errores del `POST` en línea, no con toast. SPEC 03 fijó que `toast()` solo se llama desde `QueryCache.onError`, que no cubre mutaciones; mantener esa regla evita un `toast()` disperso.
- **Sí:** al completar, invalidar los prefijos `['dashboard']`, `['meters']` y `['anomalies']`. Los KPI, los estados de los medidores y las listas dependen de la última corrida.
- **Sí:** `/anomalies` usa el `analysisId` de `GET /dashboard/summary` (última corrida `COMPLETED`). El backend exige `analysisId` en `GET /anomalies`, y el summary ya lo entrega sin endpoint nuevo.
- **Sí:** filtros de severidad, tipo y medidor en el cliente sobre la lista completa de la corrida, guardados en la URL. El backend devuelve todas las anomalías sin paginar y el volumen del MVP es pequeño. Se descartó filtrar en el servidor (`severity`/`type` existen como query params) porque duplica la lógica y rompe la coherencia con `/meters` de SPEC 03.
- **Sí:** orden fijo por `priorityScore` descendente, con desempate por `detectedAt` desc y `id`. El requisito pide una lista priorizada, no ordenable; las columnas ordenables quedan fuera.
- **Sí:** enlazar las anomalías recientes del detalle de medidor al expediente. SPEC 03 lo dejó fuera solo porque el destino no existía. Este spec reemplaza su criterio "sin enlace ni botón de investigación".
- **Sí:** `reason` y `recommendedAction` pueden ser `null` (así los tipa SPEC 03) y se muestran con un texto de respaldo.
- **No:** eventos correlacionados en el expediente. Se pidieron en el requisito original, pero `relatedEvents` son ids sin endpoint asociado. Se evaluó leer `events` con Firestore, parsear el id en el frontend y mostrar los ids crudos; el usuario decidió omitir la sección. Si el backend añade `GET /events`, se reabre en otro spec.
- **No:** filtro por estado de la anomalía. Todas son `OPEN` y no hay escritura.
- **No:** Zustand para el estado del análisis. Un hook con estado local y TanStack Query para las invalidaciones bastan, y la corrida solo se consume en el Dashboard.
- **No:** `onSnapshot` para anomalías ni KPIs. Se refrescan por invalidación al completar la corrida.
- **No:** timeouts ni "corrida atascada" en la UI. Sin datos de cuánto tarda una corrida real, un umbral sería arbitrario.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| El backend no tiene `firestore.rules`; sin lectura permitida a autenticados, `onSnapshot` falla con `permission-denied`. | Fallback automático a polling de `GET /ai/analysis/:id` y regla documentada en README y en el prerrequisito de verificación. El modo polling se indica en `AnalysisProgress`. |
| Reglas demasiado abiertas en producción al copiar `allow read: if request.auth != null` a otras colecciones. | El README limita la regla a `analyses` con `allow write: if false`. Las reglas y su despliegue son del backend. |
| La corrida sigue en el backend tras un `FAILED` tardío o si el proceso muere (sin worker), y queda `RUNNING` para siempre. | Riesgo heredado del backend (SPEC 03, limitación conocida). El usuario puede lanzar otra corrida al recargar sin sesión activa; la clave de `sessionStorage` caduca con la pestaña. |
| Una corrida iniciada por otra vía (CLI u otra pestaña) no se ve en la UI, y un segundo `POST` corre en paralelo. | Aceptado en el MVP: solo se protege contra dobles clics y recargas de la misma pestaña. |
| `sessionStorage` bloqueado (modo privado) o `analysisId` obsoleto. | Lecturas y escrituras en `try/catch`. Un id cuyo documento no existe borra la clave y no muestra error. |
| StrictMode ejecuta los efectos dos veces y duplica la suscripción. | El efecto devuelve el `unsubscribe`; test "no duplica suscripciones". |
| `onSnapshot` en jsdom no funciona. | Los tests mockean `firebase/firestore` y `@/lib/firebase`; la suscripción real se verifica a mano contra Firestore. |
| Firestore devuelve un documento con forma inesperada (fase desconocida). | Una fase fuera de `ANALYSIS_PHASES` se muestra sin marcar ninguna fase y se conserva `pct`. No rompe la pantalla. |
| El breadcrumb de `/anomalies/:id` muestra el id crudo de Firestore. | Aceptado, mismo criterio que `meterId` en SPEC 03; un id legible requiere otro spec. |

---

## What is **not** in this spec

- Deploy y video demo.
- Eventos correlacionados en el expediente.
- `firestore.rules` y su despliegue (solo documentación del requisito).
- Parámetros del análisis en la UI y cancelación de corridas.
- Historial de corridas, selector de `analysisId` y descubrimiento de corridas activas de otras sesiones.
- Cambios de estado de anomalías, filtro por estado, paginación, búsqueda de texto y exportación.
- Tema oscuro.

Cada uno de estos puntos, si se hace, va en su propio spec.
