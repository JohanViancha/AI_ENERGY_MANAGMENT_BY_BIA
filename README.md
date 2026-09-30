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
3. **Detalle de medidor** — consumo actual vs baseline, variación, estado, histórico y variables eléctricas.
4. **Anomalías IA** — tabla priorizada con tipo, severidad, confianza y acción recomendada.
5. **Investigación** — expediente completo: qué encontró la IA, evidencia, eventos relacionados, acción.
6. **Run AI Analysis** — botón para disparar el análisis y ver el progreso en vivo.

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
- Backend NestJS corriendo (local o remoto)
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
│   │   └── utils.ts
│   ├── services/
│   │   ├── meters.service.ts
│   │   ├── anomalies.service.ts
│   │   ├── ai.service.ts
│   │   └── dashboard.service.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-meters.ts
│   │   ├── use-anomalies.ts
│   │   └── use-analysis.ts
│   ├── store/
│   │   └── auth.store.ts
│   ├── pages/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── meters/
│   │   ├── meter-detail/
│   │   ├── anomalies/
│   │   ├── anomaly-detail/
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
│   │   │   └── empty-state.tsx
│   │   ├── ui/                
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx
│   │   │   └── summary-panel.tsx
│   │   ├── meters/
│   │   │   ├── meter-table.tsx
│   │   │   ├── meter-filters.tsx
│   │   │   └── meter-status-badge.tsx
│   │   ├── charts/
│   │   │   ├── consumption-chart.tsx
│   │   │   └── baseline-comparison-chart.tsx
│   │   ├── anomalies/
│   │   │   ├── anomaly-table.tsx
│   │   │   ├── anomaly-type-badge.tsx
│   │   │   ├── severity-badge.tsx
│   │   │   └── confidence-indicator.tsx
│   │   └── ai/
│   │       ├── run-analysis-button.tsx
│   │       ├── analysis-progress.tsx
│   │       └── evidence-panel.tsx
│   ├── types/
│   │   ├── meter.ts
│   │   ├── reading.ts
│   │   ├── anomaly.ts
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
| `/` | Dashboard (KPIs) | Sí |
| `/meters` | Lista de medidores | Sí |
| `/meters/:meterId` | Detalle de medidor | Sí |
| `/anomalies` | Lista de anomalías IA | Sí |
| `/anomalies/:id` | Investigación de anomalía | Sí |
| `*` | 404 | — |

