## Learned User Preferences

- Use one git commit per distinct goal or fix.
- Do not commit files under `.cursor/hooks/state/`; they are local Cursor hook runtime state.
- When implementing an attached plan, do not edit the plan file itself.
- For multi-commit planned work, create a feature branch instead of committing directly to `main`.
- Do not merge or push to remote unless explicitly asked.
- When the user asks to keep their git activity green, push each file change to `main` as separate commits.

## Learned Workspace Facts

- Multi-tenant SaaS built with Next.js 16, Supabase (Auth/DB/RLS), and shadcn/ui.
- Session routing and auth gating live in `src/proxy.ts` (Next.js 16 proxy convention, not `middleware.ts`).
- App routes and components live under `src/`; shadcn UI primitives are at root `components/ui/`.
- Package name is `multi-tenant`.
- Database schema is maintained in `supabase/schema.sql` with incremental SQL in `supabase/migrations/`.
- The repo has no automated tests (no test runner or `*.test`/`*.spec` files).
- Authorization is enforced primarily via Supabase RLS; UI permission gates are not a security boundary.
