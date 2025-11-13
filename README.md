# Water Refilling Ledger - Frontend

> **Part of Polyrepo**: [Backend Repository](https://github.com/walaywashere/ledger-v2-backend) | [Migration Guide](https://github.com/walaywashere/ledger-v2/blob/main/POLYREPO_MIGRATION.md)

React + Vite + TypeScript frontend web app for a family-run water refilling business sales tracking system with React Query caching, debt management tools, and mobile-optimized UI.

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/walaywashere/ledger-v2-frontend.git
cd ledger-v2-frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

App runs at: `http://localhost:5173`

**⚠️ Important**: Backend must be running first at `http://localhost:3000`

## 📦 Features

### Authentication
- JWT-based login with auto-refresh
- Protected routes with automatic redirects
- InputOTP 6-digit passcode entry
- Session persistence

### Custom Pricing System
- **Global toggle** to enable/disable custom pricing per customer
- When **ON**: Each customer can have individual unit price
- When **OFF**: All sales use global unit price
- Toggle respects all existing custom prices (reversible)
- Pricing-aware components must import `usePricing()` or `getEffectivePriceFromData()` (see `docs/PRICING_GUIDE.md`)

### Pages
- **Dashboard** (`/`) - At-a-glance KPIs + stitched analytics (lazy loaded)
- **Today** (`/today`) - Quick entry form + today's sales + KPIs + location chart
- **Previous** (`/previous`) - Date selector + past entries with delete confirmations
- **Analysis** (`/analysis`) - Multi-day trend charts (daily + location performance)
- **History** (`/history`) - Per-customer purchase timeline
- **Customers** (`/customers`) - Customer CRUD with search/pagination
- **Debts** (`/debts`) - Running tab overview with charges, payments, adjustments
- **Debts > Customer** (`/debts/customer/:customerId`) - Customer debt detail + ledger
- **Debts Wizard** (`/debts/post-day`) - Guided flow for post-day reconciliation
- **Settings** (`/settings`) - Unit price, custom pricing toggle, business info (admin only)
- **Login** (`/login`) - Passcode-based authentication

### Performance Optimizations
- ⚡ **React Query Caching** - 80% reduction in API requests
- 🚀 **Optimistic Updates** - Instant UI feedback
- 📱 **Mobile Optimized** - Swipe gestures + fast animations
- 🎨 **Hardware Acceleration** - 60fps animations
- 🔄 **Request Deduplication** - Shared cache across components

### UI/UX
- Dark theme with Yaris Ledger color scheme
- 10 location-based color system
- Custom scrollbars (webkit + Firefox)
- Responsive design (mobile-first)
- shadcn/ui components with Tailwind CSS v4

## 🛠️ Tech Stack

- **Core**: React 19 + TypeScript + Vite
- **State**: React Query (@tanstack/react-query)
- **Routing**: React Router v7
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS v4
- **Charts**: Recharts
- **HTTP**: Axios with interceptors
- **Forms**: Controlled inputs with Zod validation
- **Notifications**: Sonner

## 📁 Project Structure

```
frontend-v2/
├── docs/
│   └── PRICING_GUIDE.md    # ⚠️ Required reading for pricing components
├── src/
│   ├── pages/              # Route-level pages
│   │   ├── Dashboard.tsx
│   │   ├── Today.tsx
│   │   ├── PreviousEntries.tsx
│   │   ├── DateRangeAnalysis.tsx
│   │   ├── CustomerHistory.tsx
│   │   ├── Customers.tsx
│   │   ├── Settings.tsx
│   │   ├── DebtsPage.tsx
│   │   ├── CustomerDebtPage.tsx
│   │   ├── PostDayDebtWizard.tsx
│   │   └── Login.tsx
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Sidebar, Navbar, MobileNav
│   │   ├── shared/         # KPICard, EntryCard, ChartWrapper
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── [domain]/       # Domain-specific components
│   ├── lib/
│   │   ├── hooks/          # Custom hooks (useSales, useCustomers, usePricing)
│   │   ├── queries/        # React Query hooks
│   │   ├── api/            # API clients with adapters
│   │   ├── contexts/       # React contexts (SettingsContext)
│   │   ├── utils/          # Utilities (analytics, etc.)
│   │   ├── colors.ts       # Location color system
│   │   ├── constants.ts    # App constants
│   │   ├── queryClient.ts  # React Query config
│   │   └── types.ts        # TypeScript interfaces
│   └── App.tsx             # Main app with routing
└── public/
```

## 🔧 Environment Variables

Create `.env` file:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# Production example:
# VITE_API_URL=https://your-backend.railway.app/api
```

## 🎨 Design System

### Color Scheme
- **Background**: slate-900 (`#0f172a`)
- **Card**: slate-800 (`#1e293b`)
- **Primary**: sky-500 (`#0ea5e9`)
- **Border**: slate-700 (`#334155`)

### Location Colors
Each of the 10 locations has a unique color palette:
- BANAI (Blue), DOUBE_L (Green), JOVIL_3 (Yellow), etc.
- Used for badges, charts, and visual differentiation

### Components
- shadcn/ui with New York style
- Custom styling with Tailwind CSS v4
- Dark theme throughout
- Custom scrollbars matching theme

## 📡 API Integration

### React Query Setup
```typescript
// queryClient.ts
- staleTime: 30 seconds (data fresh)
- gcTime: 5 minutes (cache duration)
- Automatic refetch on window focus
- Request deduplication
```

### Hooks Pattern
```typescript
// Sales data with caching
const { data: sales, isLoading } = useSalesQuery();

// Mutations with optimistic updates
const addSaleMutation = useAddSaleMutation();
await addSaleMutation.mutateAsync(saleData);
```

### Response Adapters
Backend has inconsistent response structures - adapters normalize:
- Sales: Double nested `{ success, data: { data, pagination } }`
- Customers: Single nested `{ success, data, pagination }`
- Settings: Simple `{ success, data }`

See `src/lib/api/adapters.ts` for details.

## 🧪 Development

### Running Tests
```bash
npm run lint          # ESLint validation
npm run build         # TypeScript check + Vite build
npm run preview       # Preview production build
```

### Adding shadcn Components
```bash
npx shadcn@latest add <component-name>
```

### File Size Rule
Keep files ≤ 300 lines. Extract to smaller components/hooks when needed.

## 📱 Mobile Features

### Swipe Gestures
- Swipe right from left edge (20-120px) to open sidebar
- Avoids Android/iOS system gesture conflicts
- Requires 100px swipe with velocity > 0.3px/ms

### Performance
- 200ms animations (60% faster than default)
- Hardware-accelerated transforms
- Memoized components (React.memo)
- Optimistic updates for instant feedback

### Responsive Design
- Mobile-first approach
- Breakpoints: mobile (375px), tablet (768px), desktop (1920x1080)
- Touch-optimized controls
- Custom mobile navigation drawer

## 🚢 Deployment

### Build for Production
```bash
npm run build
# Output: dist/
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Environment Variables
Set `VITE_API_URL` to your production backend URL:
```bash
VITE_API_URL=https://your-backend.railway.app/api
```

### Other Platforms
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting

## 🔗 Related Repositories

- **Backend**: https://github.com/walaywashere/ledger-v2-backend
- **Migration Guide**: https://github.com/walaywashere/ledger-v2/blob/main/POLYREPO_MIGRATION.md

## 📝 Development Notes

### Key Patterns
- **Path Aliases**: Use `@/` prefix for imports (configured in `tsconfig`)
- **API Responses**: Route adapters normalize backend envelopes (see `lib/api/adapters.ts`)
- **Date Handling**: Always rely on helpers in `lib/utils/dateUtils.ts` or `getTodayISO()` for Manila timezone accuracy
- **State Management**: React Query caches API data; domain hooks wrap queries/mutations for Today/Dashboard/Debt flows
- **Loading States**: Use Skeleton components and optimistic updates via React Query mutations
- **Error Handling**: Surface issues via Sonner toasts (`<Toaster />` in `App.tsx`) and domain hook error callbacks
- **Pricing Calculations**: ALWAYS use `usePricing()` or `getEffectivePriceFromData()` (docs/PRICING_GUIDE.md)

### React Query Benefits
- Automatic caching (shared across Today, Dashboard, Debt flows)
- Background refetch on window focus + stale-time awareness (30s default)
- Optimistic updates (instant UI when adding sales/charges)
- Request deduplication and error rollbacks

### Performance Tips
- Use `useMemo` for computed values
- Use `useCallback` for event handlers
- Wrap components with `React.memo`
- Keep dependencies minimal
- Monitor React Query DevTools

## 🎯 Project Goals

Built for a family water refilling business:
- Up to 3 concurrent users
- Single product (gallon)
- 10 fixed locations
- Simple, fast, mobile-friendly
- Minimal server costs

## 📄 License

MIT License - See LICENSE file for details

---

**Made for a family water refilling business** 💧
