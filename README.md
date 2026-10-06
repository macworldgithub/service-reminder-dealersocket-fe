# DealerSocket Operations Frontend (Next.js)

Next.js 14 App Router automotive operations web application designed for high-density workflow management, real-time report analysis, interactive data grids, and live PDF template customization.

---

## 🛠 Tech Stack & Architecture

- **Next.js 14**: App Router with React 18
- **Styling**: Tailwind CSS, custom modern automotive design tokens
- **Data Fetching**: TanStack Query (React Query) with automated Axios bearer token injection
- **Data Tables**: TanStack Table for sorting, filtering, column visibility, and pagination
- **Icons**: Lucide React
- **PDF Export**: Client-side high-fidelity rendering (`jspdf` + `html2canvas`) and server-side PDFKit stream integration

---

## 📁 Routes & Pages

```
src/app/
├── layout.tsx              # Root Next.js layout with TanStack Query & Auth Providers
├── globals.css             # Tailwind base & SaaS styling tokens
├── page.tsx                # Operational Dashboard with KPIs, recent imports & audit feed
├── login/page.tsx          # Authentication screen with instant demo role switcher
├── reports/
│   ├── page.tsx            # Reports catalog with search, status filters & duplicate actions
│   └── [id]/page.tsx       # Detail view (Overview, Records Grid, Live PDF Viewer, Mappings, Audit)
├── imports/
│   ├── page.tsx            # Ingestion history log with error inspection modal
│   └── new/page.tsx        # 5-step file ingestion pipeline wizard
├── templates/page.tsx      # PDF, SMS, Email, and VA Task reminder templates
├── campaigns/page.tsx      # Decoupled campaign sequence manager
├── audit/page.tsx          # Global compliance audit log
├── users/page.tsx          # User administration (Admin only)
└── settings/page.tsx       # Dealership preferences, deduplication logic & DMS integrations
```

---

## 🏃 Running the Frontend

```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev

# Build for production
npm run build
npm run start
```

Default application URL: `http://localhost:7001`
API proxy: Configured in `next.config.js` to route `/api/*` to `http://localhost:7000/api/*`.
