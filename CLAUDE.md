# CLAUDE.md

Este archivo proporciona orientación a Claude Code (o cualquier agente de IA) cuando trabaja con el código de este repositorio.

## Estado del proyecto: auth, layout y pantallas de lectura listos, resto por construir

El README describe la app SaaS prevista —un dashboard de gestión energética con medidores, anomalías detectadas por IA y flujos de investigación, que consume un backend NestJS y se autentica vía Firebase Auth—. Hoy existen tres specs:

- **Spec 01 (base de auth):** Firebase Auth con login Email/Password, `AuthProvider`/`useAuth`, `ProtectedRoute`, cliente Axios con `Bearer <idToken>` y tests.
- **Spec 02 (layout SaaS):** `AppLayout` (`src/components/layout/`) con `Sidebar` (fijo en `lg`, drawer `Sheet` por debajo), `Header` (breadcrumbs, email y Logout) y breadcrumbs derivados de la ruta (`buildBreadcrumbs` + `ROUTE_LABELS`). `<Toaster>` de sonner montado en `main.tsx`. `EmptyState` reutilizable en `src/components/shared/`. Router: `/login` y `*` sin layout; `/`, `/meters` y `/anomalies` bajo `ProtectedRoute` → `AppLayout`.

- **Spec 03 (dashboard y medidores con datos reales):** `DashboardPage`, `MetersPage` y `MeterDetailPage` (`src/pages/meter-detail/`, ruta `/meters/:meterId`) son **reales** y consumen el backend. Servicios en `src/services/` (`meters`, `anomalies`, `dashboard`), hooks de TanStack Query en `src/hooks/` (`use-meters`, `use-meter`, `use-meter-readings`, `use-meter-anomalies`, `use-dashboard-summary`), fábrica de query keys en `src/lib/query-keys.ts`, tipos en `src/types/` (el JSON del backend viaja en `camelCase`) y formateo `es-CO` en `src/lib/format.ts`. `QueryCache.onError` global en `src/lib/query-client.ts` (toast salvo 401, 404 o datos en caché) y `ErrorState` en `src/components/shared/`. El estado del medidor (`OK`/`ALERT`/`CRITICAL`) se deriva en el frontend con `getMeterStatus`; el backend no lo devuelve. Filtros, búsqueda y orden de `/meters` viven en la URL (`meter-list-params.ts`).

`AnomaliesPage` sigue siendo un **placeholder** con un `EmptyState`; su contenido real (y `POST /ai/analyze`) llega en el spec 04.

**La estructura del README sigue siendo el objetivo a construir.** Antes de asumir que un archivo, hook, servicio o componente del README existe, revisa `src/`: análisis de IA (`ai.service`, `use-analysis`), lista e investigación de anomalías y stores todavía no existen.

## Stack

Instalado y configurado: React 19, React Router v6, TanStack Query, Zustand (instalado, sin uso todavía), Axios, Recharts, Tailwind CSS v3 (`tailwind.config.ts`), shadcn/ui + Radix (`components.json`, componentes en `src/components/ui/`, incl. `sheet`, `breadcrumb`, `table`, `badge`, `skeleton` y `tabs`), Firebase Auth, React Hook Form + Zod, Lucide React, y Vitest + Testing Library.

Sonner está instalado (se importa `Toaster` directamente de `sonner`, sin el wrapper de shadcn); `toast()` solo se llama desde el `QueryCache.onError` global. Recharts está instalado; en jsdom `ResponsiveContainer` mide 0, así que los gráficos se verifican a mano. Si una funcionalidad necesita otra dependencia que no está instalada, **instálala**.

shadcn/ui se añade a mano o con la CLI revisando `components.json`: el proyecto usa Tailwind v3, no v4.

## Comandos

- `npm run dev` — servidor de desarrollo de Vite
- `npm run build` — `tsc -b && vite build` (verifica tipos vía project references antes de empaquetar)
- `npm run lint` — ESLint sobre todo el repositorio
- `npm run test` — Vitest (`vitest run`, jsdom); los tests viven junto al archivo que prueban (`foo.ts` → `foo.test.ts`)
- `npm run preview` — previsualizar un build de producción

## Variables de entorno

`.env.example` es la plantilla (`VITE_FIREBASE_*` y `VITE_API_BASE_URL`); `.env` está en `.gitignore`. `src/lib/firebase.ts` lanza un error con el nombre de la variable `VITE_FIREBASE_*` que falte. Vite solo sustituye accesos estáticos `import.meta.env.VITE_X`, no lecturas dinámicas.

## TypeScript

- Configuración estilo solución: el `tsconfig.json` raíz solo referencia a `tsconfig.app.json` (src) y `tsconfig.node.json` (vite.config.ts) — edita el apropiado, no el raíz.
- `verbatimModuleSyntax: true` — los imports de solo tipos deben usar `import type { X } from ...`, o el build falla.
- `moduleResolution: "bundler"` con alias `@/` → `src/` (`paths` en `tsconfig.app.json` y `resolve.alias` en `vite.config.ts`). No se usa `baseUrl`: está deprecado en TypeScript 6 y rompe el build.
- `noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` están forzados — variables/parámetros sin usar son errores de build, no solo warnings de lint.

## Linting

Configuración plana (`eslint.config.js`): `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` (preset de Vite). Solo se ignora `dist`. Por `react-refresh/only-export-components`, contexto, provider y hook van en archivos separados (`auth-context.ts`, `auth-provider.tsx`, `use-auth.ts`).

## Carencias a tener en cuenta

- Sin configuración de CI y sin archivo LICENSE — no referencies nada de esto como si existiera.
- Tests para `ProtectedRoute`, `AuthProvider`, el interceptor de Axios, `buildBreadcrumbs`, `Sidebar`, `Header`, `EmptyState`, `ErrorState`, servicios, `format`, `query-client`, `getMeterStatus`, `applyMeterListParams`, badges y las tres pantallas de datos (mockean `@/services/*`; sin MSW). Los gráficos solo se prueban en su estado vacío y sus `aria-label`; `AppLayout` no se prueba en jsdom (las media queries no aplican) y se verifica a mano. Sin medición de cobertura configurada.
- `npm audit` reporta 2 vulnerabilidades moderadas en `react-router` v6; la corrección exige migrar a v7, pendiente de decidir en otro spec.
- Repositorio de pocos commits — no hay convención de mensajes de commit establecida aquí más allá de los estándares globales del usuario.
