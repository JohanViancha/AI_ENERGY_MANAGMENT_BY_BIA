# AI Energy Management Platform — Frontend

SPA en **React + TypeScript + Vite** para la gestión de medidores eléctricos, visualización de anomalías detectadas por IA y ejecución de análisis.

Consume la API del backend NestJS y se autentica con Firebase Auth.

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Stack tecnológico](#-stack-tecnológico)
- [Flujo de usuario](#-flujo-de-usuario)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Rutas](#-rutas)
- [Análisis IA en vivo](#-análisis-ia-en-vivo)
- [Componentes clave](#-componentes-clave)
- [Manejo de estado](#-manejo-de-estado)
- [Autenticación](#-autenticación)
- [Design system](#-design-system)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Decisiones técnicas](#-decisiones-técnicas)

---

## 🎯 Descripción

Aplicación web tipo **SaaS de Energy Management** que permite:

1. **Dashboard** — KPIs agregados: medidores, consumo total, anomalías detectadas, prioridad alta, confianza IA, último análisis.
2. **Gestión de medidores** — lista con filtros (todos/normales/alertas/críticas), búsqueda por `meter_id` y ordenamiento.
3. **Detalle de medidor** — estado, consumo por rango (24 h / 7 d / 14 d) con las ventanas de anomalía sombreadas, variables eléctricas (voltaje, corriente, factor de potencia) y anomalías recientes. La comparación contra baseline queda pendiente de un endpoint del backend.
4. **Anomalías IA** — tabla priorizada de la última corrida, con filtros por severidad, tipo y medidor guardados en la URL.
5. **Investigación** — expediente completo: qué encontró la IA, evidencia (baseline vs observado, ventana, señales y puntajes por detector) y acción recomendada. Los eventos correlacionados quedan fuera hasta que el backend exponga un endpoint.
6. **Run AI Analysis** — botón del Dashboard que dispara el análisis y muestra el progreso de las 7 fases en vivo.

El diseño debe **sentirse como un producto SaaS real**, no como una demo técnica.

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 18+ |
| Lenguaje | TypeScript 5+ |
| Build tool | Vite 5+ |
| Routing | React Router v6 |
| Estado global | Zustand |
| Data fetching | TanStack Query (React Query) |
| HTTP client | Axios |
| Estilos | Tailwind CSS 3+ |
| Componentes UI | shadcn/ui + Radix |
| Gráficas | Recharts (o Tremor) |
| Iconos | Lucide React |
| Autenticación | Firebase Auth (client SDK) |
| Formularios | React Hook Form + Zod |
| Notificaciones | Sonner (toasts) |
| Testing | Vitest + Testing Library |

---

## 🔄 Flujo de usuario
Login
↓
Dashboard (KPIs)
↓
Medidores (lista + filtros)
↓
Detalle de medidor (M-109)
↓
Run AI Analysis
↓
Anomalías IA (lista priorizada)
↓
Investigación (M-109)
↓
Acción recomendada


## ✅ Requisitos previos

- Node.js 20 LTS
- npm 10+
- Backend NestJS (`AI_ENERGY_API_BY_BIA`) corriendo, en la rama `spec-03-contrato-api-http` o ya fusionada, con:
  - Firestore sembrado (`npm run seed`).
  - Al menos un análisis ejecutado (`npm run analyze`); sin él el dashboard muestra "Aún no hay análisis".
  - El origen del frontend (`http://localhost:5173` con Vite) en su variable `CORS_ORIGIN`.
- Proyecto Firebase con Authentication habilitado (Email/Password)
- Web app registrada en Firebase Console (para obtener las credenciales)

---

## 📦 Instalación

```bash
# 1. Clonar repositorio
git clone <URL_DEL_REPO>
cd ai-energy-management/frontend

# 2. Instalar dependencias
npm install

# 3. Copiar plantilla de variables de entorno
cp .env.example .env

# 4. Editar .env con tus credenciales

# 5. Levantar en modo desarrollo
npm run dev
```

---

## 🔐 Variables de entorno

Se definen en `.env` (ignorado por git). La plantilla es `.env.example`; nunca subas valores reales.

| Variable | Propósito | Ejemplo |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | API key del proyecto Firebase | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de Firebase | `mi-proyecto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | `mi-proyecto` |
| `VITE_FIREBASE_APP_ID` | ID de la web app registrada en Firebase | `1:1234567890:web:abcdef` |
| `VITE_API_BASE_URL` | URL base del backend NestJS | `http://localhost:3000` |

Si falta alguna variable `VITE_FIREBASE_*`, la app falla al arrancar con un error que indica cuál es.

---

## 🧰 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Verifica tipos (`tsc -b`) y genera el build de producción |
| `npm run lint` | ESLint sobre todo el repositorio |
| `npm run test` | Ejecuta los tests una vez con Vitest |
| `npm run preview` | Previsualiza el build de producción |

---

## 📁 Estructura del proyecto 

frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router/
│   │   └── index.tsx
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── axios.ts
│   │   ├── query-client.ts
│   │   ├── query-keys.ts
│   │   ├── analysis-phases.ts
│   │   ├── format.ts
│   │   └── utils.ts
│   ├── services/
│   │   ├── meters.service.ts
│   │   ├── anomalies.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── ai.service.ts
│   │   └── analysis-stream.service.ts   # único punto que conoce Firestore
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-meters.ts
│   │   ├── use-meter.ts
│   │   ├── use-meter-readings.ts
│   │   ├── use-meter-anomalies.ts
│   │   ├── use-anomalies.ts
│   │   ├── use-anomaly.ts
│   │   ├── use-dashboard-summary.ts
│   │   └── use-analysis.ts        # useAnalysisRun
│   ├── store/
│   │   └── auth.store.ts
│   ├── pages/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── meters/
│   │   ├── meter-detail/          # meter-detail-page.tsx, meter-ranges.ts
│   │   ├── anomalies/
│   │   ├── anomaly-detail/        # anomaly-detail-page.tsx
│   │   └── not-found/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-layout.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── build-breadcrumbs.ts
│   │   │   └── nav-items.ts
│   │   ├── shared/
│   │   │   ├── empty-state.tsx
│   │   │   └── error-state.tsx
│   │   ├── ui/                
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx
│   │   │   └── summary-panel.tsx
│   │   ├── meters/
│   │   │   ├── meter-table.tsx
│   │   │   ├── meter-filters.tsx
│   │   │   ├── meter-list-params.ts
│   │   │   ├── meter-status.ts
│   │   │   ├── meter-status-badge.tsx
│   │   │   └── meter-summary-cards.tsx
│   │   ├── charts/
│   │   │   ├── consumption-chart.tsx
│   │   │   ├── metric-chart.tsx
│   │   │   ├── chart-tooltip.tsx
│   │   │   └── chart-data.ts
│   │   ├── anomalies/
│   │   │   ├── anomaly-labels.ts
│   │   │   ├── anomaly-type-badge.tsx
│   │   │   ├── severity-badge.tsx
│   │   │   ├── recent-anomalies-table.tsx
│   │   │   ├── anomaly-table.tsx
│   │   │   ├── anomaly-filters.tsx
│   │   │   ├── anomaly-list-params.ts
│   │   │   └── confidence-indicator.tsx
│   │   └── ai/
│   │       ├── run-analysis-button.tsx
│   │       ├── analysis-progress.tsx
│   │       └── evidence-panel.tsx
│   ├── types/
│   │   ├── meter.ts
│   │   ├── reading.ts
│   │   ├── anomaly.ts
│   │   ├── dashboard.ts
│   │   ├── api-error.ts
│   │   └── analysis.ts
│   └── styles/
│       └── globals.css
├── public/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
 


## 🔗 Rutas

| Ruta | Página | Protegida |
|------|--------|-----------|
| `/login` | Login con Firebase Auth | No |
| `/` | Dashboard (KPIs y Run AI Analysis) | Sí |
| `/meters` | Lista de medidores | Sí |
| `/meters/:meterId` | Detalle de medidor | Sí |
| `/anomalies` | Lista de anomalías IA | Sí |
| `/anomalies/:id` | Investigación de anomalía | Sí |
| `*` | 404 | — |


---

## ⚡ Análisis IA en vivo

El botón **Run AI Analysis** del Dashboard llama a `POST /ai/analyze` (cuerpo `{}`: todos los medidores, parámetros por defecto del backend). Es el único lugar que lo hace: `useAnalysisRun` en `src/hooks/use-analysis.ts`.

- **Progreso en vivo:** el hook se suscribe con `onSnapshot` al documento `analyses/{analysisId}` de Firestore y `AnalysisProgress` muestra la barra global y las 7 fases (`READINGS` → `RECOMMENDATION`).
- **Modo polling (fallback):** si la suscripción falla (por ejemplo `permission-denied`), el hook consulta `GET /ai/analysis/:id` cada 2 s y `AnalysisProgress` muestra "Modo polling". No se muestra ningún toast.
- **Persistencia:** el `analysisId` activo se guarda en `sessionStorage` (`energy:active-analysis-id`) para retomar el progreso al recargar. Se borra al llegar a `COMPLETED` o `FAILED`.
- **Al completar:** se invalidan las queries `['dashboard']`, `['meters']` y `['anomalies']`, así que KPIs, medidores y anomalías se refrescan sin recargar.
- **Formato de datos:** los documentos de Firestore usan `snake_case`; `mapAnalysisDoc` (`analysis-stream.service.ts`) los convierte a `camelCase` una sola vez.

### Reglas de Firestore requeridas

El backend no incluye `firestore.rules`. Para que el progreso llegue por `onSnapshot` (sin polling), la colección `analyses` debe permitir lectura a usuarios autenticados:

```
match /analyses/{analysisId} {
  allow read: if request.auth != null;
  allow write: if false;
}
```

Limita la regla a `analyses`; no la copies a otras colecciones. Las reglas y su despliegue son responsabilidad del backend. Sin ellas la app sigue funcionando en modo polling.
