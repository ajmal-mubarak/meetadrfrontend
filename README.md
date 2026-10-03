# MeetAdr - Healthcare Platform Frontend

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-cyan.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey.svg)]()

Modern, high-performance web client for **meetAdr** — an enterprise healthcare appointment booking and provider discovery platform across the UAE and GCC region.

---

## Features & Portals

### 1. Patient Experience & Discovery
- **Doctor Discovery**: Multi-parameter search by medical specialty, location (Dubai, Abu Dhabi, etc.), affiliated hospital or clinic, rating, and available day.
- **Facility Explorer**: Directory of accredited hospitals and clinics with department listings and accepted insurance networks.
- **Smart Booking Flow**: Real-time slot availability calculator with double-booking prevention.
- **Patient Dashboard**: Manage upcoming consultations, past appointment history, family dependents, and digital prescriptions.
- **Bilingual Support**: English & Arabic with dynamic RTL layout adjustments.

### 2. Doctor Portal
- **Consultation Dashboard**: Daily appointments schedule, patient check-in status, and weekly KPIs.
- **Weekly Schedule Manager**: Configure working days, shift start/end times, and slot durations (15m, 30m, 45m, 60m).
- **Patient Records & Prescriptions**: Digital prescription issuance with dosage and frequency instructions.

### 3. Facility Administrator Portal
- **Hospital & Clinic Operations**: Track facility appointment volume, occupancy, and doctor roster.
- **Department & Doctor Management**: Associate physicians with specialized facility departments.

### 4. Platform Superadministrator Portal
- **Provider Accreditation Queue**: Review, approve, or reject healthcare provider onboarding requests.
- **Platform Analytics & Audit Trail**: System-wide performance overview and immutable compliance audit logs.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Routing** | [React Router DOM v7](https://reactrouter.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Animations** | [Motion](https://motion.dev/) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **State & Context** | React Context (`AuthContext`, `ToastContext`) |

---

## Project Structure

```
frontend/
├── public/                # Static assets, branding & icons
├── src/
│   ├── components/        # Reusable UI components (Navbar, Footer, Modals, Cards)
│   ├── config/            # Canonical API routes & normalization
│   ├── context/           # Global AuthContext & Toast notification system
│   ├── data/              # Fallback mock data and insurance providers
│   ├── i18n/              # English & Arabic translation dictionaries
│   ├── pages/             # Page views & route targets
│   │   ├── auth/          # Clean production Sign In & Registration
│   │   ├── patient/       # Patient dashboard, booking, dependents
│   │   ├── doctor/        # Doctor portal, schedule, consults
│   │   ├── hospital/      # Facility administrator operations
│   │   └── admin/         # Platform superadmin control center
│   ├── services/          # REST API services (Django / Supabase integration)
│   ├── types/             # Shared TypeScript interfaces & types
│   ├── App.tsx            # Main router configuration & layout wrappers
│   └── main.tsx           # Application entrypoint
├── index.html             # HTML template
├── package.json           # Dependencies and build scripts
├── vite.config.ts         # Vite bundler configuration
└── .env.example           # Environment template
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher (Node 20+ recommended)
- **npm** or **bun** / **yarn**

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/ajmal-mubarak/meetadrfrontend.git
cd meetadrfrontend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your backend API URL in `.env`:
```env
# Target URL for the Django REST Framework API:
VITE_API_BASE_URL=http://localhost:8000/api

# Set to "false" to connect to real Django backend & Supabase DB,
# or "true" to use offline demo mock data:
VITE_USE_MOCK_API=false
```

### 3. Run Development Server
```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server on port `3000` with HMR |
| `npm run build` | Builds optimized production bundle into `dist/` |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

---

## Production Deployment

### Build the Static Bundle:
```bash
npm run build
```

The compiled files will be output to the `dist/` directory, ready to be deployed to:
- **Vercel** / **Netlify** / **Cloudflare Pages**
- **AWS S3 + CloudFront**
- **Nginx** / **Docker**
