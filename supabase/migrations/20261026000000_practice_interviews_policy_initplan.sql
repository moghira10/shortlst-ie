-- Evaluate auth.uid() once per query instead of once per row
-- (Supabase advisor lint 0003_auth_rls_initplan).
alter policy "practice_interviews_select_own"
  on public.practice_interviews
  using ((select auth.uid()) = user_id);
