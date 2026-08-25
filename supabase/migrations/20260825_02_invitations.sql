-- Invitation lookup/accept/decline RPCs, hide tokens from ordinary members.

CREATE UNIQUE INDEX IF NOT EXISTS workspace_invitations_pending_email
  ON public.workspace_invitations (workspace_id, lower(email))
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invite_token TEXT)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  workspace_name TEXT,
  workspace_slug TEXT,
  email TEXT,
  role workspace_role,
  status invitation_status,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    i.id,
    i.workspace_id,
    w.name,
    w.slug,
    i.email,
    i.role,
    i.status,
    i.expires_at
  FROM public.workspace_invitations i
  JOIN public.workspaces w ON w.id = i.workspace_id
  WHERE i.token = invite_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(invite_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_id UUID;
  inv_workspace_id UUID;
  inv_email TEXT;
  inv_role workspace_role;
  inv_status invitation_status;
  inv_expires TIMESTAMPTZ;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT i.id, i.workspace_id, i.email, i.role, i.status, i.expires_at
  INTO inv_id, inv_workspace_id, inv_email, inv_role, inv_status, inv_expires
  FROM public.workspace_invitations i
  WHERE i.token = invite_token
  FOR UPDATE;

  IF inv_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF inv_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'This invitation has already been %', inv_status;
  END IF;

  IF inv_expires IS NOT NULL AND inv_expires < now() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF lower(COALESCE(auth.jwt() ->> 'email', '')) IS DISTINCT FROM lower(inv_email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  IF inv_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot accept an owner invitation';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (inv_workspace_id, uid, inv_role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.workspace_invitations
  SET status = 'accepted'
  WHERE id = inv_id;

  RETURN inv_workspace_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_workspace_invitation(invite_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_id UUID;
  inv_email TEXT;
  inv_status invitation_status;
  inv_expires TIMESTAMPTZ;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT i.id, i.email, i.status, i.expires_at
  INTO inv_id, inv_email, inv_status, inv_expires
  FROM public.workspace_invitations i
  WHERE i.token = invite_token
  FOR UPDATE;

  IF inv_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF inv_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'This invitation has already been %', inv_status;
  END IF;

  IF inv_expires IS NOT NULL AND inv_expires < now() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF lower(COALESCE(auth.jwt() ->> 'email', '')) IS DISTINCT FROM lower(inv_email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  UPDATE public.workspace_invitations
  SET status = 'revoked'
  WHERE id = inv_id;
END;
$$;

DROP POLICY IF EXISTS "Workspace members can view invitations" ON public.workspace_invitations;
DROP POLICY IF EXISTS "Owner/Admin/Manager can view invitations" ON public.workspace_invitations;
DROP POLICY IF EXISTS "Owner/Admin/Manager can create invitations" ON public.workspace_invitations;

CREATE POLICY "Owner/Admin/Manager can view invitations"
  ON public.workspace_invitations FOR SELECT USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Owner/Admin/Manager can create invitations"
  ON public.workspace_invitations FOR INSERT WITH CHECK (
    public.get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
    AND role <> 'owner'
  );

REVOKE ALL ON FUNCTION public.accept_workspace_invitation(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decline_workspace_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_workspace_invitation(TEXT) TO authenticated;
