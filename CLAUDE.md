# CLAUDE.md

Este archivo proporciona orientación a Claude Code (o cualquier agente de IA) cuando trabaja con el código de este repositorio.

## Estado del proyecto: base de auth lista, resto por construir

El README describe la app SaaS prevista —un dashboard de gestión energética con medidores, anomalías detectadas por IA y flujos de investigación, que consume un backend NestJS y se autentica vía Firebase Auth—. Hoy existe solo la base (spec 01): Firebase Auth con login Email/Password, `AuthProvider`/`useAuth`, `ProtectedRoute`, cliente Axios con `Bearer <idToken>`, router (`/login`, `/` vacía, `*` 404) y tests.

**La estructura del README sigue siendo el objetivo a construir.** Antes de asumir que un archivo, hook, servicio o componente del README existe, revisa `src/`: medidores, anomalías, `AppLayout`, servicios y stores todavía no existen.

## Stack

Instalado y configurado: React 19, React Router v6, TanStack Query, Zustand (instalado, sin uso todavía), Axios, Tailwind CSS v3 (`tailwind.config.ts`), shadcn/ui + Radix (`components.json`, componentes en `src/components/ui/`), Firebase Auth, React Hook Form + Zod, Lucide React, y Vitest + Testing Library.

Aún sin instalar: Recharts y Sonner. Cuando una funcionalidad los necesite, **instálalos**.

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
- Tests solo para `ProtectedRoute`, `AuthProvider` y el interceptor de Axios; sin medición de cobertura configurada.
- `npm audit` reporta 2 vulnerabilidades moderadas en `react-router` v6; la corrección exige migrar a v7, pendiente de decidir en otro spec.
- Repositorio de pocos commits — no hay convención de mensajes de commit establecida aquí más allá de los estándares globales del usuario.
