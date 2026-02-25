# Multi-Tenant SaaS Boilerplate

A production-ready **multi-tenant SaaS boilerplate** built with **Next.js 14+**, **Supabase**, and **shadcn/ui**. Features a complete three-tier hierarchy (Super Admin → Workspace → Project) with granular role-based access control, Row-Level Security, and a modern UI.

## 🚀 Features

- **🏢 Three-Tier Hierarchy**: Super Admin → Workspace → Project
- **🔐 Role-Based Access Control**: 6 workspace roles + 5 project roles
- **🛡️ Row-Level Security (RLS)**: Database-level security with PostgreSQL policies
- **⚡ Next.js 14+**: App Router, Server Components, Server Actions
- **🎨 Modern UI**: shadcn/ui + Tailwind CSS + Radix UI
- **🔑 Authentication**: Supabase Auth with email/password
- **📊 Audit Logging**: Track all platform activities
- **✨ TypeScript**: Full type safety

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN (Platform)                   │
│  • Manage all workspaces & users                            │
│  • Platform analytics & audit logs                          │
│  • System configuration                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Workspace│    │Workspace│    │Workspace│    │Workspace│
   │  (Org)  │    │  (Org)  │    │  (Org)  │    │  (Org)  │
   └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
        │              │              │              │
   ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
   │Projects │    │Projects │    │Projects │    │Projects │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

## 📁 Project Structure

```
├── app/
│   ├── (auth)/                 # Auth pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (platform)/             # Authenticated pages
│   │   ├── workspace/          # Workspace pages
│   │   │   ├── [workspaceSlug]/
│   │   │   │   ├── page.tsx           # Dashboard
│   │   │   │   ├── projects/          # Project list
│   │   │   │   ├── members/           # Member management
│   │   │   │   ├── analytics/         # Analytics
│   │   │   │   ├── settings/          # Settings
│   │   │   │   └── project/[projectSlug]/
│   │   │   │       ├── page.tsx       # Project dashboard
│   │   │   │       └── settings/      # Project settings
│   │   │   └── new/              # Create workspace
│   │   ├── admin/                # Super Admin panel
│   │   │   ├── page.tsx          # Admin dashboard
│   │   │   ├── workspaces/       # Manage workspaces
│   │   │   ├── users/            # Manage users
│   │   │   └── audit-log/        # Platform audit log
│   │   └── onboarding/           # First workspace setup
│   ├── api/auth/callback/        # Auth callback
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── auth/                     # Auth components
│   ├── layout/                   # Header, Sidebar
│   ├── shared/                   # PermissionGate
│   └── ui/                       # shadcn/ui components
├── hooks/                        # Custom React hooks
├── lib/
│   ├── supabase/                 # Supabase clients
│   ├── constants.ts              # Role definitions
│   └── permissions.ts            # Permission utilities
├── types/database.ts             # TypeScript types
├── middleware.ts                 # Next.js middleware
└── supabase/
    └── schema.sql                # Complete database schema
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd multi-tenant
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

Option A: Use the schema file directly in Supabase SQL Editor:
```bash
# Copy contents of supabase/schema.sql and run in Supabase Dashboard
```

Option B: Use Supabase CLI:
```bash
npx supabase link
npx supabase db push
```

### 4. Set up Super Admin

After creating your first user via signup, run this SQL to make them super admin:

```sql
UPDATE public.profiles 
SET is_super_admin = TRUE 
WHERE id = 'your-user-uuid';
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 👥 Roles & Permissions

### Workspace Roles (6)

| Role | Delete WS | Manage Billing | Manage Members | Create Projects | View Analytics |
|------|:---------:|:--------------:|:--------------:|:---------------:|:--------------:|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Manager** | ❌ | ❌ | Invite Only | ✅ | ✅ |
| **Member** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Billing Admin** | ❌ | ✅ | ❌ | ❌ | ❌ |

### Project Roles (5)

| Role | Delete Project | Manage Members | Create Content | Edit Content | View |
|------|:--------------:|:--------------:|:--------------:|:------------:|:----:|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Editor** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Commenter** | ❌ | ❌ | ❌ | Comment | ✅ |
| **Viewer** | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends `auth.users`) |
| `workspaces` | Tenant/organization data |
| `workspace_members` | Workspace membership with roles |
| `workspace_invitations` | Pending member invitations |
| `projects` | Projects within workspaces |
| `project_members` | Project membership with roles |
| `audit_logs` | Activity tracking |

### Enums

```sql
workspace_role: owner | admin | manager | member | viewer | billing_admin
project_role: owner | admin | editor | commenter | viewer
invitation_status: pending | accepted | expired | revoked
```

See [supabase/schema.sql](supabase/schema.sql) for complete schema including:
- All table definitions
- Indexes
- Helper functions
- Triggers
- RLS policies

## 🔐 Security

### Row-Level Security (RLS)

All tables have RLS enabled with policies for:
- ✅ Super admin full access
- ✅ Workspace member access control
- ✅ Project member access control
- ✅ Ownership-based permissions
- ✅ Self-service (leave workspace/project)

### Permission Checking

```typescript
// Client-side permission check
import { PermissionGate } from "@/components/shared/permission-gate";

<PermissionGate workspaceRole={role} workspace="workspace.members.manage">
  <InviteMemberButton />
</PermissionGate>
```

```typescript
// Hook usage
import { usePermissions } from "@/hooks/use-permissions";

const { checkWorkspace } = usePermissions({ workspaceRole: role });
if (checkWorkspace("workspace.delete")) {
  // Show delete button
}
```

## 📡 API Routes

### Auth Routes
- `GET /login` - Sign in
- `GET /signup` - Sign up
- `GET /forgot-password` - Reset password

### Workspace Routes
- `GET /workspace` - Workspace list/selector
- `GET /workspace/new` - Create workspace
- `GET /workspace/[slug]` - Dashboard
- `GET /workspace/[slug]/projects` - Projects
- `GET /workspace/[slug]/members` - Member management
- `GET /workspace/[slug]/analytics` - Analytics
- `GET /workspace/[slug]/settings` - Settings

### Project Routes
- `GET /workspace/[slug]/project/[slug]` - Project dashboard
- `GET /workspace/[slug]/project/[slug]/settings` - Project settings

### Admin Routes
- `GET /admin` - Admin dashboard
- `GET /admin/workspaces` - Manage workspaces
- `GET /admin/users` - Manage users
- `GET /admin/audit-log` - Audit log

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14+** | React framework with App Router |
| **Supabase** | Database, Auth, Realtime |
| **PostgreSQL** | Relational database |
| **shadcn/ui** | UI component library |
| **Tailwind CSS** | Styling |
| **Radix UI** | Headless UI primitives |
| **TypeScript** | Type safety |

## 📦 Key Dependencies

```json
{
  "next": "^14.x",
  "@supabase/ssr": "^0.x",
  "@supabase/supabase-js": "^2.x",
  "@radix-ui/*": "latest",
  "tailwindcss": "^3.x",
  "typescript": "^5.x"
}
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## 🚧 Roadmap

- [ ] Billing integration (Stripe)
- [ ] Email notifications
- [ ] Real-time updates
- [ ] File uploads (Storage)
- [ ] API rate limiting
- [ ] Feature flags

## 📄 License

MIT License - feel free to use this for your own SaaS products!

---

## 💡 Need Help?

- Check the [PRD.md](PRD.md) for detailed specifications
- Review [supabase/schema.sql](supabase/schema.sql) for database setup
- Open an issue for bugs or feature requests
