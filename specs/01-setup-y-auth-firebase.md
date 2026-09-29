# SPEC 01 — Setup del proyecto y autenticación con Firebase

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-09-28
> **Objective:** Dejar el proyecto Vite + React + TS con el stack base instalado y un flujo de autenticación con Firebase (login, ruta protegida vacía, logout) que envía `Bearer <idToken>` en cada request de Axios.

---

## Por qué existe este spec

Hoy `src/` es la plantilla sin modificar de Vite `react-ts` y ninguna dependencia del stack del README está instalada. Todos los specs siguientes (dashboard, medidores, anomalías) necesitan un router, un cliente HTTP autenticado y un usuario en sesión. Este spec construye esa base y nada más.

---

## Scope

**In:**

- Instalar y configurar Tailwind CSS v3, shadcn/ui (con Radix), React Router v6, TanStack Query, Zustand, Axios, Firebase, React Hook Form, Zod y Lucide React.
- Instalar y configurar Vitest + Testing Library y añadir el script `npm run test`.
- Añadir el alias `@/` → `src/` en `vite.config.ts` y `tsconfig.app.json`.
- Variables de entorno `VITE_*` con `.env.example`, y `.env` añadido al `.gitignore`.
- Inicialización de Firebase Auth (`src/lib/firebase.ts`).
- `AuthContext` con `onAuthStateChanged`, `login(email, password)` y `logout()`.
- Página `/login` con Email/Password (React Hook Form + Zod) y errores en línea.
- Componente `<ProtectedRoute>`.
- Instancia de Axios con interceptor de request (`Authorization: Bearer <idToken>`) e interceptor de response (401 → refrescar token una vez y reintentar).
- Pantalla protegida `/` vacía, con el email del usuario y el botón Logout.
- Ruta `*` con una página 404 mínima.
- Tests unitarios de `ProtectedRoute`, `AuthProvider` y el interceptor de Axios, con Firebase mockeado.
- Actualizar el README (comandos, variables de entorno) y el CLAUDE.md (alias, Vitest, `.env.example`).

**Out of scope (para futuros specs):**

- Registro de usuarios, recuperación de contraseña y verificación de email.
- Login con Google u otros proveedores.
- Roles, permisos o claims personalizados.
- `AppLayout`, sidebar y header completos.
- Dashboard, medidores, anomalías y cualquier llamada real al backend NestJS.
- Toasts con Sonner.
- Firebase Auth Emulator.
- CI, LICENSE y despliegue.
- Store de Zustand para auth (`auth.store.ts`): Zustand se instala pero no se usa.

---

## Data model

Este spec no introduce datos persistentes propios. La sesión la persiste el SDK de Firebase (`browserLocalPersistence`, su valor por defecto) y el spec no añade nada en `localStorage`.

```ts
// src/context/auth-context.ts
import type { User } from 'firebase/auth';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean; // true hasta que onAuthStateChanged dispara por primera vez
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

```ts
// src/pages/login/login-schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;
```

Variables de entorno (`.env.example`, sin valores reales):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:3000
```

Convenciones:

- Los archivos nuevos usan `kebab-case`. Cada archivo exporta una sola cosa principal.
- `AuthContext`, `AuthProvider` y `useAuth` van en archivos separados para no violar `react-refresh/only-export-components`.
- Los imports de solo tipos usan `import type` (`verbatimModuleSyntax`).

---

## Implementation plan

Cada paso deja el proyecto compilando (`npm run build`) y arrancando (`npm run dev`).

1. **Entorno y alias.** Añadir `.env` al `.gitignore`. Crear `.env.example`. Añadir el alias `@/` en `vite.config.ts` y `paths`/`baseUrl` en `tsconfig.app.json`. Verificación: `npm run build` pasa.
2. **Tailwind v3 y shadcn/ui.** Instalar `tailwindcss@3`, `postcss` y `autoprefixer`. Crear `tailwind.config.ts`, `postcss.config.js` y `src/styles/globals.css`. Ejecutar la inicialización de shadcn (`components.json`, `src/lib/utils.ts`). Añadir los componentes `button`, `input`, `label` y `card` en `src/components/ui/`. Verificación: un `<Button>` se ve con estilos en `npm run dev`.
3. **Limpiar la plantilla.** Reemplazar el contador de `App.tsx` por un placeholder, borrar `App.css` e `index.css`, e importar `globals.css` desde `main.tsx`. Verificación: la página deja de mostrar la demo de Vite.
4. **Firebase.** Instalar `firebase`. Crear `src/lib/firebase.ts` que lee las variables `VITE_FIREBASE_*` y exporta `auth`. Debe fallar con un error claro si falta alguna variable. Verificación: la app arranca con un `.env` local válido.
5. **AuthContext.** Crear `src/context/auth-context.ts`, `src/context/auth-provider.tsx` y `src/hooks/use-auth.ts`. El provider suscribe `onAuthStateChanged`, expone `login` (`signInWithEmailAndPassword`) y `logout` (`signOut`), y llama a `queryClient.clear()` cuando el usuario pasa a `null`. Verificación: un componente temporal muestra `user` e `isLoading`.
6. **Query client y providers.** Instalar `@tanstack/react-query`, `zustand` y `axios`. Crear `src/lib/query-client.ts`. Montar `QueryClientProvider` y `AuthProvider` en `main.tsx`. Verificación: la app arranca sin errores en consola.
7. **Cliente Axios.** Crear `src/lib/axios.ts` con `baseURL = VITE_API_BASE_URL`. El interceptor de request añade `Authorization: Bearer <idToken>` con `auth.currentUser.getIdToken()`. El interceptor de response, ante un 401 sin marca `_retry`, llama a `getIdToken(true)` y reintenta una sola vez. Si el reintento falla, o no hay usuario, hace `signOut(auth)`. Verificación: los tests del paso 11 lo cubren.
8. **Router y ProtectedRoute.** Instalar `react-router-dom@6`. Crear `src/router/index.tsx` con `/login`, `/` (protegida) y `*`. Crear `src/router/protected-route.tsx`: muestra un indicador de carga si `isLoading`, redirige a `/login` guardando la ruta de origen en `state.from` si `user` es `null`, y renderiza `<Outlet />` en otro caso. Verificación: abrir `/` sin sesión redirige a `/login`.
9. **Página de login.** Instalar `react-hook-form`, `zod` y `@hookform/resolvers`. Crear `src/pages/login/login-schema.ts` y `src/pages/login/login-page.tsx`. Traducir los errores de Firebase a mensajes en español (ver Decisiones). Si ya hay sesión, redirigir a `state.from` o a `/`. Verificación: login con un usuario real lleva a `/`.
10. **Pantalla protegida y 404.** Crear `src/pages/dashboard/dashboard-page.tsx` (contenedor vacío, email del usuario y botón Logout que llama a `logout()` y navega a `/login`) y `src/pages/not-found/not-found-page.tsx`. Verificación: logout devuelve a `/login` y `/` vuelve a redirigir.
11. **Vitest y tests.** Instalar `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` y `@testing-library/user-event`. Configurar `test` en `vite.config.ts`, crear `src/test/setup.ts` y añadir el script `npm run test`. Escribir `protected-route.test.tsx`, `auth-provider.test.tsx` y `axios.test.ts` junto a sus archivos, con `firebase/auth` mockeado. Verificación: `npm run test` pasa.
12. **Documentación.** Actualizar el README (comandos, variables de entorno) y el CLAUDE.md (alias `@/`, Vitest, `.env.example`, Tailwind v3).

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores de tipos ni de bundling.
- [ ] `npm run lint` termina sin errores.
- [ ] `npm run test` pasa y cubre `ProtectedRoute`, `AuthProvider` y el interceptor de Axios.
- [ ] `.env` aparece en `.gitignore` y `.env.example` existe sin valores reales.
- [ ] `git status` no muestra ningún archivo `.env`.
- [ ] Abrir `/` sin sesión redirige a `/login`.
- [ ] Mientras `isLoading` es `true`, `ProtectedRoute` muestra el indicador de carga y no redirige.
- [ ] Un formulario de login con un correo inválido muestra "Ingresa un correo válido" y no llama a Firebase.
- [ ] Un login con credenciales incorrectas muestra el error en línea y permanece en `/login`.
- [ ] Un login con credenciales válidas navega a `/` y muestra el email del usuario.
- [ ] Recargar la página en `/` mantiene la sesión y no pasa por `/login`.
- [ ] Un usuario con sesión que abre `/login` es redirigido a `/`.
- [ ] Pulsar Logout navega a `/login`, y abrir `/` después vuelve a redirigir a `/login`.
- [ ] Tras el logout, `queryClient.getQueryCache().getAll()` devuelve una lista vacía.
- [ ] Un request hecho con la instancia de Axios lleva la cabecera `Authorization: Bearer <idToken>`.
- [ ] Ante un 401, el interceptor llama a `getIdToken(true)` y reintenta el request exactamente una vez.
- [ ] Si el reintento también responde 401, se llama a `signOut` y no se reintenta de nuevo.
- [ ] Una URL inexistente muestra la página 404.
- [ ] `src/` ya no contiene el contador de la plantilla de Vite.

Prerrequisito de la verificación manual: un proyecto Firebase con Email/Password habilitado y un usuario creado desde la consola de Firebase.

---

## Decisions

- **Sí:** Tailwind v3 con `tailwind.config.ts`. Coincide con el README y es la combinación más estable con shadcn/ui. Tailwind v4 se descartó porque se aparta del README.
- **Sí:** alias `@/` → `src/`. shadcn/ui lo necesita. Esto cambia la regla actual del CLAUDE.md ("sin alias"), que se actualiza en el paso 12.
- **Sí:** solo Email/Password. Es lo que habilita el README. Google queda para otro spec.
- **Sí:** `AuthContext` como única fuente del estado de auth. Zustand se instala y no se usa. Se descartó duplicar el estado en `auth.store.ts` porque tendría dos fuentes de verdad.
- **Sí:** `queryClient.clear()` cuando `onAuthStateChanged` entrega `null`. Cubre el logout manual y el forzado por un 401, y evita que el siguiente usuario vea datos en caché del anterior.
- **Sí:** el interceptor pide el token con `getIdToken()` en cada request. El SDK renueva el token vencido por su cuenta, así que no se guarda el token en ningún store ni en `localStorage`.
- **Sí:** ante un 401, `getIdToken(true)` y un solo reintento. Si falla, `signOut`, y `ProtectedRoute` hace la redirección al ver `user === null`. Se descartó redirigir desde Axios para no acoplarlo al router.
- **Sí:** la contraseña exige mínimo 6 caracteres en el esquema Zod, que es el mínimo de Firebase. El mensaje de error real lo decide Firebase.
- **Sí:** los errores de Firebase se muestran en línea con estos mensajes en español:
  - `auth/invalid-credential` → "Correo o contraseña incorrectos".
  - `auth/too-many-requests` → "Demasiados intentos. Inténtalo más tarde".
  - `auth/network-request-failed` → "Sin conexión. Revisa tu red".
  - Cualquier otro código → "No se pudo iniciar sesión".
- **Sí:** tras el login se vuelve a la ruta de origen (`state.from`) o a `/`. Es el comportamiento esperado de una ruta protegida.
- **Sí:** Vitest con tests mínimos en este spec. Tus estándares globales exigen tests unitarios para la lógica.
- **Sí:** `/` con un contenedor vacío, el email y Logout. Es la ruta del Dashboard según el README.
- **No:** Firebase Auth Emulator. Suma configuración y el spec se verifica con un proyecto Firebase real.
- **No:** Sonner. Los errores de login son en línea y no hay otra notificación que mostrar todavía.
- **No:** `AppLayout` completo. Adelanta trabajo de layout que merece su propio spec.
- **No:** llamada real al backend. Ninguna pantalla lo usa todavía y el interceptor se verifica con tests.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| La CLI de shadcn detecta Tailwind v4 o pide un formato distinto al de v3. | Fijar `tailwindcss@3` antes de ejecutar `shadcn init` y revisar `components.json`. Si falla, añadir los componentes a mano. |
| Faltan variables `VITE_FIREBASE_*` y la app arranca en blanco. | `src/lib/firebase.ts` lanza un error con el nombre de la variable que falta. |
| Varios requests concurrentes reciben 401 a la vez y disparan varios refrescos. | Aceptado en este spec: `getIdToken(true)` es idempotente y no hay requests reales todavía. Se revisa en el primer spec que use el backend. |
| Un usuario con sesión pasa un instante en `/login` antes de que `onAuthStateChanged` responda. | `LoginPage` también respeta `isLoading` y no renderiza el formulario hasta que Firebase responde. |
| La `apiKey` de Firebase queda expuesta en el bundle. | Es un identificador público por diseño en Firebase. La seguridad depende de las reglas del proyecto y del backend, que valida el `idToken`. |

---

## What is **not** in this spec

- Registro, recuperación de contraseña, verificación de email.
- Login con Google u otros proveedores.
- Roles y permisos.
- `AppLayout`, sidebar y header completos.
- Dashboard, medidores, anomalías y llamadas reales al backend.
- Sonner y cualquier otro sistema de notificaciones.
- Firebase Auth Emulator.
- Store de auth en Zustand.
- CI, LICENSE y despliegue.

Cada uno de estos puntos, si se hace, va en su propio spec.
