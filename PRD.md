# Multi-Tenant Supabase Application — AI Generation Prompt

## Overview

Build a **production-ready multi-tenant SaaS application** using:

- **Next.js 14+** (App Router)
- **Supabase** (Auth, Database via PostgreSQL, Row-Level Security, Edge Functions)
- **shadcn/ui** components (with Radix UI primitives + Tailwind CSS)
- **TypeScript** throughout

The application follows a **three-tier hierarchy**:

```
Super Admin (Level 0 — Platform-wide)
  └── Workspace (Level 1 — Organization/Tenant)
        └── Project (Level 2 — Scoped work unit)
```

---

## 1. Tenancy & Hierarchy Model

### Level 0 — Super Admin (Platform)

The **Super Admin** is a God-mode role that operates across the entire platform. There is no tenant boundary for this role.

| Capability | Description |
|---|---|
| Manage all workspaces | Create, suspend, delete, configure any workspace |
| Manage all users | View, impersonate, deactivate any user on the platform |
| Manage billing & plans | Assign/change subscription plans per workspace |
| View platform analytics | Global usage stats, revenue, user growth, error rates |
| Manage feature flags | Enable/disable features per workspace or globally |
| System configuration | Email templates, OAuth providers, API rate limits |
| Audit logs | Full platform-wide audit trail access |
| Manage roles & permissions | Define custom roles and permission sets available to workspaces |

---

### Level 1 — Workspace (Organization/Tenant)

A **Workspace** is the primary tenant boundary. All data is isolated per workspace. Each workspace has its own members, billing, settings, and projects.

#### Suggested Workspace Roles

| Role | Description |
|---|---|
| **Workspace Owner** | Full control of the workspace. Can delete workspace, manage billing, transfer ownership. Only 1 per workspace. |
| **Workspace Admin** | Near-full control — manages members, roles, settings, and all projects. Cannot delete the workspace or transfer ownership. |
| **Workspace Manager** | Can create/manage projects, invite members to workspace, and view workspace-level reports. Cannot change workspace settings or billing. |
| **Workspace Member** | Standard user. Can access assigned projects, view workspace directory, and update own profile. Cannot invite users or create projects unless granted. |
| **Workspace Viewer** | Read-only access to workspace-level dashboards and reports. Cannot modify anything. |
| **Workspace Billing Admin** | Manages subscription, payment methods, and invoices. No access to projects or member management. |

#### Workspace-Level Permissions Matrix

| Permission | Owner | Admin | Manager | Member | Viewer | Billing Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Delete workspace | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage billing & subscription | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage workspace settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage members & roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all projects | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View workspace analytics | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Access assigned projects | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### Level 2 — Project

A **Project** is a scoped unit of work within a workspace. Projects have their own members (subset of workspace members), settings, and data.

#### Suggested Project Roles

| Role | Description |
|---|---|
| **Project Owner** | Full control of the project. Can archive/delete project, manage project members and settings. |
| **Project Admin** | Manages project settings, members, and all content. Cannot delete/archive the project. |
| **Project Editor** | Can create, update, and delete content/resources within the project. Cannot manage members or settings. |
| **Project Commenter** | Can view all project content and add comments/annotations. Cannot create or modify resources. |
| **Project Viewer** | Read-only access to project content and dashboards. Cannot comment or modify. |

#### Project-Level Permissions Matrix

| Permission | Owner | Admin | Editor | Commenter | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Delete / archive project | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage project settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage project members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite workspace members to project | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create resources / content | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit resources / content | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete resources / content | ✅ | ✅ | ✅ | ❌ | ❌ |
| Comment on resources | ✅ | ✅ | ✅ | ✅ | ❌ |
| View project content | ✅ | ✅ | ✅ | ✅ | ✅ |
| View project analytics | ✅ | ✅ | ✅ | ❌ | ✅ |
| Export project data | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 2. Database Schema (Supabase / PostgreSQL)

### Core Tables

```sql
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE workspace_role AS ENUM (
  'owner', 'admin', 'manager', 'member', 'viewer', 'billing_admin'
);

CREATE TYPE project_role AS ENUM (
  'owner', 'admin', 'editor', 'commenter', 'viewer'
);

CREATE TYPE invitation_status AS ENUM (
  'pending', 'accepted', 'expired', 'revoked'
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE TABLE public.workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  plan          TEXT DEFAULT 'free',
  settings      JSONB DEFAULT '{}',
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WORKSPACE MEMBERS
-- ============================================================
CREATE TABLE public.workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          workspace_role NOT NULL DEFAULT 'member',
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================
-- WORKSPACE INVITATIONS
-- ============================================================
CREATE TABLE public.workspace_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          workspace_role NOT NULL DEFAULT 'member',
  invited_by    UUID REFERENCES public.profiles(id),
  status        invitation_status DEFAULT 'pending',
  token         TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  expires_at    TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE public.projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  settings      JSONB DEFAULT '{}',
  is_archived   BOOLEAN DEFAULT FALSE,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================
CREATE TABLE public.project_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          project_role NOT NULL DEFAULT 'viewer',
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  project_id    UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,           -- e.g., 'member.invited', 'project.created'
  target_type   TEXT,                    -- e.g., 'workspace', 'project', 'member'
  target_id     UUID,
  metadata      JSONB DEFAULT '{}',
  ip_address    INET,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX idx_audit_logs_workspace ON public.audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get user's role in a workspace
CREATE OR REPLACE FUNCTION public.get_workspace_role(ws_id UUID)
RETURNS workspace_role AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get user's role in a project
CREATE OR REPLACE FUNCTION public.get_project_role(proj_id UUID)
RETURNS project_role AS $$
  SELECT role FROM public.project_members
  WHERE project_id = proj_id AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- PROFILES POLICIES
-- =============================================
CREATE POLICY "Users can view any profile"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- WORKSPACES POLICIES
-- =============================================
CREATE POLICY "Super admins can do anything with workspaces"
  ON public.workspaces FOR ALL USING (public.is_super_admin());

CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace owners/admins can update"
  ON public.workspaces FOR UPDATE USING (
    public.get_workspace_role(id) IN ('owner', 'admin')
  );

CREATE POLICY "Only workspace owner can delete"
  ON public.workspaces FOR DELETE USING (
    public.get_workspace_role(id) = 'owner'
  );

-- =============================================
-- WORKSPACE MEMBERS POLICIES
-- =============================================
CREATE POLICY "Super admins can manage all members"
  ON public.workspace_members FOR ALL USING (public.is_super_admin());

CREATE POLICY "Workspace members can view other members"
  ON public.workspace_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner/Admin can manage members"
  ON public.workspace_members FOR INSERT WITH CHECK (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Owner/Admin can update member roles"
  ON public.workspace_members FOR UPDATE USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin')
  );

CREATE POLICY "Owner/Admin can remove members"
  ON public.workspace_members FOR DELETE USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin')
    OR user_id = auth.uid()  -- Members can leave
  );

-- =============================================
-- PROJECTS POLICIES
-- =============================================
CREATE POLICY "Super admins can manage all projects"
  ON public.projects FOR ALL USING (public.is_super_admin());

CREATE POLICY "Workspace owner/admin/manager can view all projects"
  ON public.projects FOR SELECT USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Project members can view their projects"
  ON public.projects FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owner/admin/manager can create projects"
  ON public.projects FOR INSERT WITH CHECK (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Project owner or workspace admin can update"
  ON public.projects FOR UPDATE USING (
    public.get_project_role(id) = 'owner'
    OR public.get_workspace_role(workspace_id) IN ('owner', 'admin')
  );

CREATE POLICY "Only project owner or workspace owner can delete"
  ON public.projects FOR DELETE USING (
    public.get_project_role(id) = 'owner'
    OR public.get_workspace_role(workspace_id) = 'owner'
  );

-- =============================================
-- PROJECT MEMBERS POLICIES
-- =============================================
CREATE POLICY "Super admins can manage all project members"
  ON public.project_members FOR ALL USING (public.is_super_admin());

CREATE POLICY "Project members can view other project members"
  ON public.project_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owner/admin can manage members"
  ON public.project_members FOR INSERT WITH CHECK (
    public.get_project_role(project_id) IN ('owner', 'admin')
    OR public.get_workspace_role(
      (SELECT workspace_id FROM public.projects WHERE id = project_id)
    ) IN ('owner', 'admin')
  );

CREATE POLICY "Project owner/admin can remove members"
  ON public.project_members FOR DELETE USING (
    public.get_project_role(project_id) IN ('owner', 'admin')
    OR user_id = auth.uid()  -- Members can leave
  );
```

---

## 3. Next.js Application Architecture

### Directory Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (platform)/
│   │   ├── layout.tsx                         # Authenticated layout
│   │   ├── onboarding/page.tsx                # Create first workspace
│   │   │
│   │   ├── workspace/
│   │   │   ├── page.tsx                       # Workspace selector / list
│   │   │   └── [workspaceSlug]/
│   │   │       ├── layout.tsx                 # Workspace shell (sidebar, header)
│   │   │       ├── page.tsx                   # Workspace dashboard
│   │   │       ├── settings/
│   │   │       │   ├── page.tsx               # General settings
│   │   │       │   ├── members/page.tsx       # Member management
│   │   │       │   ├── billing/page.tsx       # Billing & plans
│   │   │       │   └── roles/page.tsx         # Role management
│   │   │       ├── analytics/page.tsx
│   │   │       ├── audit-log/page.tsx
│   │   │       │
│   │   │       └── project/
│   │   │           ├── page.tsx               # Project list
│   │   │           ├── new/page.tsx            # Create project
│   │   │           └── [projectSlug]/
│   │   │               ├── layout.tsx         # Project shell
│   │   │               ├── page.tsx           # Project dashboard
│   │   │               ├── settings/
│   │   │               │   ├── page.tsx       # Project settings
│   │   │               │   └── members/page.tsx
│   │   │               └── [...]/             # Your domain-specific pages
│   │   │
│   │   └── admin/                             # Super Admin panel
│   │       ├── layout.tsx
│   │       ├── page.tsx                       # Admin dashboard
│   │       ├── workspaces/page.tsx
│   │       ├── users/page.tsx
│   │       ├── plans/page.tsx
│   │       ├── feature-flags/page.tsx
│   │       └── audit-log/page.tsx
│   │
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts
│   │   └── [...]/
│   │
│   ├── layout.tsx
│   └── page.tsx                               # Landing / marketing page
│
├── components/
│   ├── ui/                                    # shadcn/ui base components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── auth-provider.tsx
│   ├── workspace/
│   │   ├── workspace-switcher.tsx
│   │   ├── workspace-card.tsx
│   │   ├── member-list.tsx
│   │   ├── invite-member-dialog.tsx
│   │   └── workspace-settings-form.tsx
│   ├── project/
│   │   ├── project-card.tsx
│   │   ├── project-list.tsx
│   │   ├── create-project-dialog.tsx
│   │   └── project-settings-form.tsx
│   ├── admin/
│   │   ├── admin-sidebar.tsx
│   │   ├── workspace-management-table.tsx
│   │   ├── user-management-table.tsx
│   │   └── platform-stats.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── breadcrumbs.tsx
│   │   └── theme-toggle.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       └── permission-gate.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                          # Browser client
│   │   ├── server.ts                          # Server client (cookies)
│   │   ├── admin.ts                           # Service role client
│   │   └── middleware.ts                      # Auth middleware helper
│   ├── permissions.ts                         # Permission checking utilities
│   ├── constants.ts                           # Role & permission constants
│   └── utils.ts
│
├── hooks/
│   ├── use-workspace.ts                       # Current workspace context
│   ├── use-project.ts                         # Current project context
│   ├── use-permissions.ts                     # Permission checking hook
│   ├── use-user.ts                            # Current user profile
│   └── use-realtime.ts                        # Supabase realtime subscriptions
│
├── types/
│   ├── database.ts                            # Generated Supabase types
│   ├── workspace.ts
│   ├── project.ts
│   └── permissions.ts
│
└── middleware.ts                               # Next.js middleware for auth + routing
```

---

## 4. Key Implementation Patterns

### 4.1 — Permission Checking (Client-Side)

```typescript
// lib/permissions.ts

export const WORKSPACE_PERMISSIONS = {
  'workspace.delete':         ['owner'],
  'workspace.transfer':       ['owner'],
  'workspace.billing':        ['owner', 'billing_admin'],
  'workspace.settings':       ['owner', 'admin'],
  'workspace.members.manage': ['owner', 'admin'],
  'workspace.members.invite': ['owner', 'admin', 'manager'],
  'workspace.projects.create':['owner', 'admin', 'manager'],
  'workspace.projects.viewAll':['owner', 'admin', 'manager'],
  'workspace.analytics':      ['owner', 'admin', 'manager', 'viewer'],
  'workspace.audit':          ['owner', 'admin'],
} as const;

export const PROJECT_PERMISSIONS = {
  'project.delete':           ['owner'],
  'project.settings':         ['owner', 'admin'],
  'project.members.manage':   ['owner', 'admin'],
  'project.content.create':   ['owner', 'admin', 'editor'],
  'project.content.edit':     ['owner', 'admin', 'editor'],
  'project.content.delete':   ['owner', 'admin', 'editor'],
  'project.comment':          ['owner', 'admin', 'editor', 'commenter'],
  'project.view':             ['owner', 'admin', 'editor', 'commenter', 'viewer'],
  'project.export':           ['owner', 'admin', 'editor'],
} as const;

export function hasWorkspacePermission(
  role: WorkspaceRole | undefined,
  permission: keyof typeof WORKSPACE_PERMISSIONS
): boolean {
  if (!role) return false;
  return WORKSPACE_PERMISSIONS[permission].includes(role);
}

export function hasProjectPermission(
  role: ProjectRole | undefined,
  permission: keyof typeof PROJECT_PERMISSIONS
): boolean {
  if (!role) return false;
  return PROJECT_PERMISSIONS[permission].includes(role);
}
```

### 4.2 — Permission Gate Component

```tsx
// components/shared/permission-gate.tsx

"use client";

import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGateProps {
  workspace?: string;   // permission key
  project?: string;     // permission key
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  workspace,
  project,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { checkWorkspace, checkProject, isSuperAdmin } = usePermissions();

  if (isSuperAdmin) return <>{children}</>;

  if (workspace && !checkWorkspace(workspace)) return <>{fallback}</>;
  if (project && !checkProject(project)) return <>{fallback}</>;

  return <>{children}</>;
}

// Usage:
// <PermissionGate workspace="workspace.members.invite">
//   <InviteMemberButton />
// </PermissionGate>
```

### 4.3 — Middleware (Auth + Workspace Resolution)

```typescript
// middleware.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users
  if (!user && request.nextUrl.pathname.startsWith("/workspace")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && ["/login", "/signup"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  // Super admin route protection
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
```

### 4.4 — Workspace Context Hook

```typescript
// hooks/use-workspace.ts

"use client";

import { createContext, useContext } from "react";

interface WorkspaceContext {
  workspace: Workspace;
  role: WorkspaceRole;
  members: WorkspaceMember[];
  isLoading: boolean;
}

const WorkspaceCtx = createContext<WorkspaceContext | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
```

---

## 5. shadcn/ui Components to Install

Run these to scaffold the UI:

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu form input label \
  select separator sheet sidebar table tabs textarea toast avatar badge \
  command popover scroll-area skeleton switch tooltip breadcrumb \
  alert-dialog data-table
```

### Key UI Compositions

| Screen | shadcn Components Used |
|---|---|
| **Login / Signup** | `Card`, `Form`, `Input`, `Button`, `Label`, `Separator` |
| **Workspace Switcher** | `Popover`, `Command`, `Avatar`, `Badge` |
| **Sidebar Navigation** | `Sidebar`, `Sheet` (mobile), `Tooltip`, `Separator` |
| **Member Management** | `DataTable`, `Dialog`, `Select`, `Badge`, `DropdownMenu` |
| **Invite Dialog** | `Dialog`, `Form`, `Input`, `Select`, `Button` |
| **Project List** | `Card`, `Badge`, `Button`, `Skeleton` |
| **Settings Pages** | `Tabs`, `Form`, `Input`, `Switch`, `Separator`, `Button` |
| **Audit Log** | `DataTable`, `Badge`, `Select` (filters), `ScrollArea` |
| **Admin Dashboard** | `Card` (stats), `DataTable`, `Badge`, `Tabs` |
| **Billing** | `Card`, `Badge`, `Button`, `AlertDialog` (cancel plan) |

---

## 6. Supabase Configuration Checklist

1. **Enable Email Auth** (+ optionally Google/GitHub OAuth)
2. **Generate TypeScript types**: `npx supabase gen types typescript --project-id <id> > src/types/database.ts`
3. **Enable Realtime** on `workspace_members`, `project_members` for live updates
4. **Create Database Functions** for:
   - Auto-creating a profile on user signup (via trigger on `auth.users`)
   - Auto-adding creator as `owner` when a workspace/project is created
5. **Storage Buckets**: `workspace-logos`, `user-avatars`, `project-files`
6. **Edge Functions** (optional): invitation emails, webhook processing

### Auto-Profile Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Auto-Owner on Workspace Creation

```sql
CREATE OR REPLACE FUNCTION public.handle_workspace_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_workspace_created();
```

---

## 7. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Your SaaS Name"

# Stripe (optional, for billing)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## 8. Implementation Order

1. **Phase 1 — Auth & Profiles**: Supabase auth, login/signup pages, profile management, middleware
2. **Phase 2 — Workspaces**: Create workspace, workspace list/switcher, workspace settings, member management + invitations
3. **Phase 3 — Projects**: CRUD projects within workspace, project members, project settings
4. **Phase 4 — Permissions & RLS**: Implement all RLS policies, permission gate component, role-based UI rendering
5. **Phase 5 — Super Admin**: Admin dashboard, workspace/user management, platform analytics
6. **Phase 6 — Polish**: Audit logging, realtime updates, billing integration, onboarding flow, email notifications

---

## 9. Prompt Summary

> Build a multi-tenant SaaS platform using **Next.js 14+ App Router**, **Supabase** (Auth, PostgreSQL, RLS, Realtime), and **shadcn/ui** components. The platform has three hierarchy levels:
>
> - **Super Admin** (platform-wide control)
> - **Workspace** (tenant boundary with Owner, Admin, Manager, Member, Viewer, Billing Admin roles)
> - **Project** (scoped work unit with Owner, Admin, Editor, Commenter, Viewer roles)
>
> Implement complete row-level security with helper functions, a permission system on both server and client, auto-triggers for profile creation and ownership assignment, and a clean workspace → project navigation structure. Use shadcn/ui for all interface components with a modern, premium aesthetic. Follow the phased implementation order starting with auth and building up to the super admin panel.
