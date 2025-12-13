# Codex Frontend

React SPA frontend for Codex - the community-curated TTRPG product database.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: TailwindCSS
- **State**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Icons**: Lucide React

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment (optional)**
   ```bash
   # Create .env.local for custom API URL
   echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript check |

## Project Structure

```
src/
├── api/           # API client and endpoint functions
├── components/    # Reusable UI components
│   └── layout/    # Layout components (Header, Footer)
├── lib/           # Utility functions
├── pages/         # Route page components
├── styles/        # Global CSS
└── types/         # TypeScript type definitions
```

## Deployment (Netlify)

The frontend is configured for Netlify deployment:

1. Connect your GitHub repo to Netlify
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Environment variables:
   - `VITE_API_URL`: Your backend API URL

### Redirects

Create `public/_redirects` for SPA routing:
```
/*    /index.html   200
```

## API Integration

The frontend connects to the Codex Django API. By default, it proxies `/api` requests to `http://localhost:8000` during development.

For production, set `VITE_API_URL` to your deployed API URL (e.g., `https://api.codex.livetorole.com`).
