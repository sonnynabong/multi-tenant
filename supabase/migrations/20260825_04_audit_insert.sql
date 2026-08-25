-- Allow authenticated users to insert their own audit log rows.

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert their own audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());
