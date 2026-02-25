# Multi-Tenant SaaS Application

A production-ready multi-tenant SaaS platform built with Next.js 14+, Supabase, and shadcn/ui.

## Features

- **Three-tier hierarchy**: Super Admin → Workspace → Project
- **Role-based access control**: Granular permissions for workspaces and projects
- **Authentication**: Email/password auth with Supabase Auth
- **Row-Level Security (RLS)**: Database-level security policies
- **Real-time updates**: Live data synchronization
- **Audit logging**: Track all platform activities

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Authentication**: Supabase Auth
- **Type Safety**: TypeScript

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (login, signup, forgot-password)
│   ├── (platform)/          # Authenticated pages
│   │   ├── workspace/       # Workspace pages
│   │   ├── admin/           # Super admin panel
│   │   └── onboarding/      # First workspace creation
│   ├── api/
│   │   └── auth/callback    # Auth callback handler
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── auth/                # Auth components
│   ├── layout/              # Layout components (header, sidebar)
│   ├── shared/              # Shared components (permission-gate)
│   └── ui/                  # shadcn/ui components
├── hooks/                   # Custom React hooks
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── constants.ts         # Role/permission constants
│   └── permissions.ts       # Permission utilities
├── types/
│   └── database.ts          # TypeScript types
└── middleware.ts            # Next.js middleware
```

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd multi-tenant
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

The database schema and RLS policies have been set up via migrations. Run:

```bash
npx supabase link
npx supabase db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Hierarchy & Roles

### Super Admin (Platform-wide)
- Manage all workspaces and users
- View platform analytics
- Access audit logs
- Configure system settings

### Workspace Roles
| Role | Permissions |
|------|-------------|
| **Owner** | Full control, delete workspace, manage billing |
| **Admin** | Manage members, settings, all projects |
| **Manager** | Create projects, invite members |
| **Member** | Access assigned projects |
| **Viewer** | Read-only access |
| **Billing Admin** | Manage subscription only |

### Project Roles
| Role | Permissions |
|------|-------------|
| **Owner** | Full control, delete project |
| **Admin** | Manage members and settings |
| **Editor** | Create, edit, delete content |
| **Commenter** | View and comment |
| **Viewer** | Read-only access |

## Database Schema

### Core Tables
- `profiles` - User profiles extending auth.users
- `workspaces` - Tenant/organization data
- `workspace_members` - Workspace membership with roles
- `workspace_invitations` - Pending invitations
- `projects` - Projects within workspaces
- `project_members` - Project membership with roles
- `audit_logs` - Activity tracking

### RLS Policies
All tables have Row-Level Security enabled with policies for:
- Super admin full access
- Workspace member access control
- Project member access control
- Ownership-based permissions

## API Routes

- `/login` - Sign in page
- `/signup` - Sign up page
- `/workspace` - Workspace list
- `/workspace/[slug]` - Workspace dashboard
- `/workspace/[slug]/projects` - Projects list
- `/workspace/[slug]/project/[slug]` - Project dashboard
- `/workspace/[slug]/settings` - Workspace settings
- `/workspace/[slug]/members` - Member management
- `/admin` - Super admin dashboard

## License

MIT
