-- Fellow-member SELECT, drop manager INSERT, owner guards, last-owner triggers.

CREATE OR REPLACE FUNCTION public.prevent_last_workspace_owner_loss()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND (
      SELECT COUNT(*) FROM public.workspace_members
      WHERE workspace_id = OLD.workspace_id AND role = 'owner'
    ) <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last workspace owner';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.role = 'owner' AND NEW.role IS DISTINCT FROM 'owner' AND (
    SELECT COUNT(*) FROM public.workspace_members
    WHERE workspace_id = OLD.workspace_id AND role = 'owner'
  ) <= 1 THEN
    RAISE EXCEPTION 'Cannot demote the last workspace owner';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_last_project_owner_loss()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND (
      SELECT COUNT(*) FROM public.project_members
      WHERE project_id = OLD.project_id AND role = 'owner'
    ) <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last project owner';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.role = 'owner' AND NEW.role IS DISTINCT FROM 'owner' AND (
    SELECT COUNT(*) FROM public.project_members
    WHERE project_id = OLD.project_id AND role = 'owner'
  ) <= 1 THEN
    RAISE EXCEPTION 'Cannot demote the last project owner';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_last_workspace_owner_loss ON public.workspace_members;
CREATE TRIGGER prevent_last_workspace_owner_loss
  BEFORE DELETE OR UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_workspace_owner_loss();

DROP TRIGGER IF EXISTS prevent_last_project_owner_loss ON public.project_members;
CREATE TRIGGER prevent_last_project_owner_loss
  BEFORE DELETE OR UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_project_owner_loss();

DROP POLICY IF EXISTS "Users can view their workspace memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace members can view fellow members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can manage workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can add workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can update workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can remove workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Managers can invite workspace members" ON public.workspace_members;

CREATE POLICY "Workspace members can view fellow members"
  ON public.workspace_members FOR SELECT USING (
    public.get_workspace_role(workspace_id) IS NOT NULL
  );

CREATE POLICY "Owners and admins can add workspace members"
  ON public.workspace_members FOR INSERT WITH CHECK (
    public.get_workspace_role(workspace_id) = 'owner'
    OR (
      public.get_workspace_role(workspace_id) = 'admin'
      AND role <> 'owner'
    )
  );

CREATE POLICY "Owners and admins can update workspace members"
  ON public.workspace_members FOR UPDATE
  USING (
    public.get_workspace_role(workspace_id) = 'owner'
    OR (
      public.get_workspace_role(workspace_id) = 'admin'
      AND role <> 'owner'
    )
  )
  WITH CHECK (
    public.get_workspace_role(workspace_id) = 'owner'
    OR (
      public.get_workspace_role(workspace_id) = 'admin'
      AND role <> 'owner'
    )
  );

CREATE POLICY "Owners and admins can remove workspace members"
  ON public.workspace_members FOR DELETE USING (
    public.get_workspace_role(workspace_id) = 'owner'
    OR (
      public.get_workspace_role(workspace_id) = 'admin'
      AND role <> 'owner'
    )
  );

DROP POLICY IF EXISTS "Project members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Workspace owners and admins can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners and admins can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners and admins can add project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners and admins can update project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners and admins can remove project members" ON public.project_members;

CREATE POLICY "Project members can view project members"
  ON public.project_members FOR SELECT USING (
    public.get_project_role(project_id) IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.get_workspace_role(p.workspace_id) IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Owners and admins can add project members"
  ON public.project_members FOR INSERT WITH CHECK (
    (
      public.get_project_role(project_id) = 'owner'
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
          AND public.get_workspace_role(p.workspace_id) IN ('owner', 'admin')
      )
    )
    AND (
      role <> 'owner'
      OR public.get_project_role(project_id) = 'owner'
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
          AND public.get_workspace_role(p.workspace_id) = 'owner'
      )
    )
  );

CREATE POLICY "Owners and admins can update project members"
  ON public.project_members FOR UPDATE
  USING (
    public.get_project_role(project_id) = 'owner'
    OR (
      public.get_project_role(project_id) = 'admin'
      AND role <> 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.get_workspace_role(p.workspace_id) = 'owner'
          OR (
            public.get_workspace_role(p.workspace_id) = 'admin'
            AND role <> 'owner'
          )
        )
    )
  )
  WITH CHECK (
    public.get_project_role(project_id) = 'owner'
    OR (
      public.get_project_role(project_id) = 'admin'
      AND role <> 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.get_workspace_role(p.workspace_id) = 'owner'
          OR (
            public.get_workspace_role(p.workspace_id) = 'admin'
            AND role <> 'owner'
          )
        )
    )
  );

CREATE POLICY "Owners and admins can remove project members"
  ON public.project_members FOR DELETE USING (
    public.get_project_role(project_id) = 'owner'
    OR (
      public.get_project_role(project_id) = 'admin'
      AND role <> 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.get_workspace_role(p.workspace_id) = 'owner'
          OR (
            public.get_workspace_role(p.workspace_id) = 'admin'
            AND role <> 'owner'
          )
        )
    )
  );
