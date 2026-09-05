# Standalone Express Backend (Deprecated / Archived)

> **MIGRATION COMPLETED**:
> All Express controllers, models, and routes from `origin_backend_A` have been migrated into native Next.js Serverless Route Handlers inside `yojana-connect/app/api/`.

### Migrated Route Mappings:
| Express Route | Next.js API Route Handler |
|---|---|
| `/api/health` | `yojana-connect/app/api/health/route.ts` |
| `/api/profile` | `yojana-connect/app/api/profile/route.ts` |
| `/api/bookmarks` | `yojana-connect/app/api/bookmarks/route.ts` |
| `/api/bookmarks/:schemeId` | `yojana-connect/app/api/bookmarks/[schemeId]/route.ts` |
| `/api/recommendations` | `yojana-connect/app/api/recommendations/route.ts` |
| `/api/chat` | `yojana-connect/app/api/chat/route.ts` |
| `/api/schemes` | `yojana-connect/app/api/schemes/route.ts` |
| `/api/schemes/:id` | `yojana-connect/app/api/schemes/[id]/route.ts` |
| `/api/users` | `yojana-connect/app/api/users/route.ts` |
| `/api/users/:id` | `yojana-connect/app/api/users/[id]/route.ts` |

### Database & Persistence:
- Local SQLite file dependencies were replaced with Supabase PostgreSQL (`yojana-connect/supabase/schema.sql` and `yojana-connect/lib/db.ts`) with seamless in-memory fallback for local development without credentials.
- In-memory vector store loads `yojana-connect/data/index/schemes.index.json` instantly on serverless invocations.

This folder is preserved for reference only. To run the full application, simply run:
```bash
npm run dev
# or inside yojana-connect:
cd yojana-connect && npm run dev
```

