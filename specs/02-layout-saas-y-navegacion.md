# SPEC 02 — Layout SaaS y navegación

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-09-29
> **Objective:** Envolver las rutas protegidas en un `<AppLayout>` con Sidebar, Header (email + Logout), breadcrumbs derivados de la ruta, `<Toaster>` de sonner y un `<EmptyState>` reutilizable, dejando `/`, `/meters` y `/anomalies` como placeholders.

---

## Por qué existe este spec

Hoy la única pantalla protegida (`/`) renderiza su propio header con email y Logout. Los specs 03 (dashboard y medidores) y 04 (anomalías) necesitan un marco común de navegación y un lugar donde vivan las notificaciones. Este spec construye ese marco y mueve el header actual a él, sin tocar el contenido de las pantallas.

---

## Scope

**In:**

- Instalar `sonner` y añadir los componentes shadcn `sheet` y `breadcrumb` en `src/components/ui/`.
- `<AppLayout>` (`src/components/layout/app-layout.tsx`): Sidebar + Header + `<Outlet />`, aplicado a todas las rutas protegidas.
- `<Sidebar>` con tres enlaces (Dashboard `/`, Medidores `/meters`, Anomalías `/anomalies`), estado activo y fijo en pantallas `lg` o mayores.
- Sidebar como drawer (`Sheet`) en pantallas menores a `lg`, abierto desde un botón hamburguesa en el Header y cerrado al navegar.
- `<Header>`: botón hamburguesa (solo < `lg`), breadcrumbs, email del usuario y botón Logout (se mueve desde `DashboardPage`).
- Breadcrumbs derivados de `useLocation()` con un mapa segmento → etiqueta (`ROUTE_LABELS`).
- `<Toaster>` de sonner montado globalmente en `main.tsx` (disponible también en `/login`), sin ningún toast activo todavía.
- `<EmptyState>` reutilizable en `src/components/shared/empty-state.tsx`.
- Placeholders `DashboardPage`, `MetersPage` y `AnomaliesPage`, cada uno con un `<EmptyState>`.
- Actualizar el router: `ProtectedRoute` → `AppLayout` → `/`, `/meters`, `/anomalies`.
- Tests unitarios de `buildBreadcrumbs`, `Sidebar`, `Header` y `EmptyState`.
- Actualizar el README y el CLAUDE.md (sonner instalado, layout existente).

**Out of scope (para futuros specs):**

- Contenido real del dashboard y de medidores (SPEC 03) y de anomalías (SPEC 04).
- Rutas de detalle (`/meters/:id`, `/anomalies/:id`) y la resolución de sus breadcrumbs dinámicos.
- Toasts en flujos concretos (por ejemplo, fallo de logout) y cualquier llamada a `toast()`.
- Tema oscuro y `next-themes`.
- Sidebar colapsable a iconos y persistencia de su estado.
- Menú de usuario (avatar, perfil, ajustes) y roles.
- Búsqueda global y notificaciones en el Header.
- Layout para `/login` y `/*` (404): quedan sin layout.

---

## Data model

Este spec no introduce datos persistentes ni estado global nuevo. Solo constantes y tipos de UI.

```ts
// src/components/layout/nav-items.ts
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean // true en '/' para que no quede activo en todas las rutas
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Medidores', to: '/meters', icon: Gauge },
  { label: 'Anomalías', to: '/anomalies', icon: AlertTriangle },
]
```

```ts
// src/components/layout/build-breadcrumbs.ts
export interface BreadcrumbItem {
  label: string
  to: string // ruta acumulada hasta ese segmento
}

export const ROUTE_LABELS: Record<string, string> = {
  meters: 'Medidores',
  anomalies: 'Anomalías',
}

// buildBreadcrumbs('/')           → [{ label: 'Dashboard', to: '/' }]
// buildBreadcrumbs('/meters')     → [{ label: 'Dashboard', to: '/' }, { label: 'Medidores', to: '/meters' }]
// buildBreadcrumbs('/meters/abc') → [..., { label: 'abc', to: '/meters/abc' }] (segmento sin etiqueta: se muestra tal cual)
```

```ts
// src/components/shared/empty-state.tsx
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode // p. ej. un <Button>; opcional
}
```

Convenciones:

- Archivos nuevos en `kebab-case`, una exportación principal por archivo.
- Los imports de solo tipos usan `import type` (`verbatimModuleSyntax`).
- Textos de UI en español.
- El último breadcrumb es la página actual: se renderiza como texto (`BreadcrumbPage`), no como enlace.

---

## Implementation plan

Cada paso deja el proyecto compilando (`npm run build`) y arrancando (`npm run dev`).

1. **Dependencias y componentes base.** Instalar `sonner`. Añadir `src/components/ui/sheet.tsx` y `src/components/ui/breadcrumb.tsx` (shadcn v3 / a mano según `components.json`). Verificación: `npm run build` pasa.
2. **EmptyState.** Crear `src/components/shared/empty-state.tsx` y `empty-state.test.tsx` (renderiza icono, título, descripción y acción opcional). Verificación: `npm run test` pasa.
3. **Breadcrumbs.** Crear `build-breadcrumbs.ts` con su test (`/`, `/meters`, `/anomalies`, segmento desconocido, barra final) y `breadcrumbs.tsx`, que usa `useLocation()` y los componentes de `breadcrumb.tsx`. Verificación: `npm run test` pasa.
4. **Sidebar.** Crear `nav-items.ts` y `sidebar.tsx` con `NavLink`, estado activo y el logo/nombre de la app. Verificación: `sidebar.test.tsx` comprueba los tres enlaces y que solo el de la ruta actual queda activo.
5. **Header.** Crear `header.tsx` con breadcrumbs, email y Logout (`logout()` y `navigate('/login', { replace: true })`, igual que hoy). Verificación: `header.test.tsx` comprueba que muestra el email y que Logout llama a `logout` y navega a `/login`.
6. **AppLayout.** Crear `app-layout.tsx`: Sidebar fijo en `lg`, Sheet con el mismo contenido de Sidebar en pantallas menores (estado `isMobileNavOpen`, se cierra al cambiar `location.pathname`), Header con el botón hamburguesa y `<Outlet />` en un `<main>`. Verificación: renderizado manual en `npm run dev` con el navegador a 1280 px y a 375 px.
7. **Páginas y router.** Reemplazar `DashboardPage` por un `<EmptyState>` (sin header propio). Crear `src/pages/meters/meters-page.tsx` y `src/pages/anomalies/anomalies-page.tsx` con su `<EmptyState>`. En `src/router/index.tsx`, anidar las tres rutas bajo `ProtectedRoute` → `AppLayout`; `/login` y `*` quedan fuera. Verificación: navegar entre las tres rutas mantiene el layout y actualiza breadcrumbs y estado activo.
8. **Toaster.** Montar `<Toaster />` de `sonner` en `main.tsx`, junto a los providers. Verificación: la app arranca sin errores en consola y `<Toaster>` está en el DOM también en `/login`.
9. **Documentación.** Actualizar el README (estructura: `components/layout/`, `components/shared/`) y el CLAUDE.md (sonner instalado; el layout, sidebar y breadcrumbs ya existen; `DashboardPage` es un placeholder).

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores de tipos ni de bundling.
- [ ] `npm run lint` termina sin errores.
- [ ] `npm run test` pasa e incluye tests de `buildBreadcrumbs`, `Sidebar`, `Header` y `EmptyState`.
- [ ] `/`, `/meters` y `/anomalies` con sesión activa muestran Sidebar, Header y un `<EmptyState>` en el área de contenido.
- [ ] Sin sesión, abrir `/meters` redirige a `/login` y `/login` no muestra Sidebar ni Header.
- [ ] Una URL inexistente muestra la página 404 sin Sidebar ni Header.
- [ ] El Sidebar contiene exactamente los enlaces Dashboard, Medidores y Anomalías, y solo el de la ruta actual tiene el estado activo (`aria-current="page"`).
- [ ] En `/` solo Dashboard está activo (no lo está en `/meters`).
- [ ] Los breadcrumbs muestran "Dashboard" en `/`, "Dashboard / Medidores" en `/meters` y "Dashboard / Anomalías" en `/anomalies`.
- [ ] El último breadcrumb no es un enlace y los anteriores sí.
- [ ] El Header muestra el email del usuario y pulsar Logout navega a `/login`; abrir `/` después vuelve a redirigir a `/login`.
- [ ] A 1280 px el Sidebar está siempre visible y el botón hamburguesa no se muestra.
- [ ] A 375 px el Sidebar está oculto, el botón hamburguesa lo abre como drawer y elegir un enlace cierra el drawer y navega.
- [ ] `<Toaster>` de sonner está en el DOM en `/login` y en las rutas protegidas.
- [ ] `<EmptyState>` recibe `icon`, `title`, `description` y `action` opcionales y no renderiza el bloque de acción si no se pasa.
- [ ] `DashboardPage` ya no renderiza email ni Logout.
- [ ] Los enlaces del Sidebar y el botón hamburguesa son operables con teclado y tienen `aria-label` donde no hay texto visible.

---

## Decisions

- **Sí:** Sidebar fijo en `lg` y drawer (`Sheet`) por debajo. Tus estándares exigen accesibilidad WCAG 2.1 AA y un SaaS se usa en tablet/móvil. Se descartó "solo desktop" porque deja el responsive como deuda.
- **Sí:** el contenido del Sidebar es un solo componente reutilizado en el fijo y en el `Sheet`. Evita duplicar la navegación.
- **Sí:** breadcrumbs con `useLocation()` y el mapa `ROUTE_LABELS`. Es lo más simple para tres rutas planas. Se descartó `handle.breadcrumb` con `useMatches()` porque solo compensa con rutas dinámicas, que no existen aún; el spec que las añada puede migrar.
- **Sí:** un segmento sin etiqueta en `ROUTE_LABELS` se muestra tal cual. No rompe ante rutas futuras y evita un estado de error.
- **Sí:** el primer breadcrumb siempre es "Dashboard" (`/`). Da un punto de partida coherente con el Sidebar.
- **Sí:** email y Logout se mueven de `DashboardPage` al Header, con la misma lógica actual (`logout()` y `navigate('/login', { replace: true })`). El comportamiento no cambia, solo la ubicación.
- **Sí:** cada placeholder usa `<EmptyState>`. Da un uso real al componente y deja verificable que el layout envuelve la ruta.
- **Sí:** `<EmptyState>` en `src/components/shared/`. `components/ui/` queda reservado a shadcn.
- **Sí:** `<Toaster>` de sonner global en `main.tsx`, importado directamente de `sonner`. Queda disponible también en `/login`. Se descartó el wrapper de shadcn porque depende de `next-themes` y no hay tema oscuro.
- **Sí:** `/login` y `*` fuera del layout. El layout es para la app autenticada.
- **Sí:** tests unitarios de `buildBreadcrumbs`, `Sidebar`, `Header` y `EmptyState`. Tus estándares exigen tests para la lógica. No se prueba `AppLayout` en jsdom porque las media queries de Tailwind no aplican allí; se verifica manualmente.
- **No:** ningún `toast()` en este spec (por ejemplo, ante un fallo de logout). Añadirlo cambia el flujo de Logout y es alcance nuevo.
- **No:** Sidebar colapsable a iconos. Añade estado y persistencia sin que nadie lo haya pedido.
- **No:** menú de usuario con avatar. El requisito es email + Logout.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| La CLI de shadcn genera `sheet`/`breadcrumb` con estilos o imports de otra versión de Tailwind. | Revisar `components.json`, comprobar el resultado contra Tailwind v3 y, si falla, escribir los componentes a mano. |
| `sonner` importa estilos propios y puede chocar con `globals.css`. | Verificar en el paso 8 que el `Toaster` renderiza sin regresiones visuales; ajustar con `toastOptions` si hace falta. |
| jsdom no aplica media queries, así que el comportamiento responsive no se prueba en tests. | Verificación manual a 1280 px y 375 px (criterios de aceptación). |
| El drawer móvil no se cierra tras navegar y tapa el contenido. | Cerrar el `Sheet` al cambiar `location.pathname` (paso 6). |
| Un segmento futuro (`/meters/abc`) muestra un identificador crudo como breadcrumb. | Aceptado: el spec que añada rutas de detalle resuelve las etiquetas dinámicas. |

---

## What is **not** in this spec

- Contenido real de dashboard, medidores y anomalías (SPEC 03 y 04).
- Rutas de detalle y breadcrumbs dinámicos.
- Toasts en flujos concretos.
- Tema oscuro.
- Sidebar colapsable a iconos.
- Menú de usuario, roles, búsqueda global y notificaciones en el Header.
- Layout para `/login` y 404.

Cada uno de estos puntos, si se hace, va en su propio spec.
