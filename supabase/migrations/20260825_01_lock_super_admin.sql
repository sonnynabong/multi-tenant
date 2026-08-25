-- Lock is_super_admin, fix SECURITY DEFINER search_path, tighten profiles SELECT.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_role(ws_id UUID)
RETURNS workspace_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_project_role(proj_id UUID)
RETURNS project_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.project_members
  WHERE project_id = proj_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.shares_workspace_with(other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members a
    JOIN public.workspace_members b ON a.workspace_id = b.workspace_id
    WHERE a.user_id = auth.uid()
      AND b.user_id = other_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.protect_is_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
    IF current_setting('app.set_super_admin', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'is_super_admin cannot be changed directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_super_admin(target_user_id UUID, make_admin BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: super admin required';
  END IF;

  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Cannot change your own super admin status';
  END IF;

  IF NOT make_admin THEN
    SELECT COUNT(*) INTO super_admin_count
    FROM public.profiles
    WHERE is_super_admin = TRUE;

    IF super_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last super admin';
    END IF;
  END IF;

  PERFORM set_config('app.set_super_admin', 'on', true);

  UPDATE public.profiles
  SET is_super_admin = make_admin
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_workspace_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_project_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_is_super_admin ON public.profiles;
CREATE TRIGGER protect_is_super_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_is_super_admin();

DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Workspace members can view co-member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Workspace members can view co-member profiles"
  ON public.profiles FOR SELECT
  USING (public.shares_workspace_with(id));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE ALL ON FUNCTION public.set_super_admin(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_workspace_with(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_super_admin(UUID, BOOLEAN) TO authenticated;
