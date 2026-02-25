-- ============================================================
-- Multi-Tenant SaaS Boilerplate - Database Schema
-- Next.js 14+ + Supabase
-- ============================================================

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
-- CORE TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Workspaces (Tenant/Organization)
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

-- Workspace Members
CREATE TABLE public.workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          workspace_role NOT NULL DEFAULT 'member',
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace Invitations
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

-- Projects (Scoped work unit within workspace)
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

-- Project Members
CREATE TABLE public.project_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          project_role NOT NULL DEFAULT 'viewer',
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  project_id    UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  target_type   TEXT,
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

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

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

-- ============================================================
-- AUTO-TRIGGER FUNCTIONS
-- ============================================================

-- Auto-create profile on user signup
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

-- Auto-add creator as owner when workspace is created
CREATE OR REPLACE FUNCTION public.handle_workspace_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-add creator as owner when project is created
CREATE OR REPLACE FUNCTION public.handle_project_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_workspace_created();

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_project_created();

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: PROFILES
-- ============================================================

CREATE POLICY "Users can view any profile"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: WORKSPACES
-- ============================================================

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

-- ============================================================
-- RLS POLICIES: WORKSPACE MEMBERS
-- ============================================================

CREATE POLICY "Super admins can manage all workspace members"
  ON public.workspace_members FOR ALL USING (public.is_super_admin());

CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage workspace members"
  ON public.workspace_members FOR ALL USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin')
  );

CREATE POLICY "Managers can invite workspace members"
  ON public.workspace_members FOR INSERT WITH CHECK (
    public.get_workspace_role(workspace_id) = 'manager'
  );

CREATE POLICY "Users can leave workspace"
  ON public.workspace_members FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: WORKSPACE INVITATIONS
-- ============================================================

CREATE POLICY "Super admins can manage all invitations"
  ON public.workspace_invitations FOR ALL USING (public.is_super_admin());

CREATE POLICY "Workspace members can view invitations"
  ON public.workspace_invitations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner/Admin/Manager can create invitations"
  ON public.workspace_invitations FOR INSERT WITH CHECK (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Owner/Admin can update invitations"
  ON public.workspace_invitations FOR UPDATE USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin')
  );

-- ============================================================
-- RLS POLICIES: PROJECTS
-- ============================================================

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

-- ============================================================
-- RLS POLICIES: PROJECT MEMBERS
-- ============================================================

CREATE POLICY "Super admins can manage all project members"
  ON public.project_members FOR ALL USING (public.is_super_admin());

CREATE POLICY "Project members can view project members"
  ON public.project_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_id AND pm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE p.id = project_id AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Workspace owners and admins can manage project members"
  ON public.project_members FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE p.id = project_id AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE p.id = project_id AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Project owners and admins can manage project members"
  ON public.project_members FOR ALL USING (
    public.get_project_role(project_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    public.get_project_role(project_id) IN ('owner', 'admin')
  );

CREATE POLICY "Users can leave project"
  ON public.project_members FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: AUDIT LOGS
-- ============================================================

CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Workspace owner/admin can view workspace audit logs"
  ON public.audit_logs FOR SELECT USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin')
  );
