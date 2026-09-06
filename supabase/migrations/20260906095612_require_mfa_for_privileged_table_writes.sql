do $$
declare
  v_table text;
  v_policy text;
begin
  foreach v_table in array array[
    'classes',
    'students',
    'teacher_classes',
    'staff_directory_profiles',
    'school_years',
    'school_year_calendar_events',
    'school_schedule_versions',
    'school_settings',
    'schedule_entries',
    'schedule_teachers',
    'staff_year_allocations',
    'teaching_requirements',
    'staff_absence'
  ] loop
    v_policy:=v_table||'_mfa_insert';
    execute format('drop policy if exists %I on public.%I',v_policy,v_table);
    execute format(
      'create policy %I on public.%I as restrictive for insert to authenticated with check (coalesce(auth.jwt()->>''aal'','''')=''aal2'')',
      v_policy,v_table
    );

    v_policy:=v_table||'_mfa_update';
    execute format('drop policy if exists %I on public.%I',v_policy,v_table);
    execute format(
      'create policy %I on public.%I as restrictive for update to authenticated using (coalesce(auth.jwt()->>''aal'','''')=''aal2'') with check (coalesce(auth.jwt()->>''aal'','''')=''aal2'')',
      v_policy,v_table
    );

    v_policy:=v_table||'_mfa_delete';
    execute format('drop policy if exists %I on public.%I',v_policy,v_table);
    execute format(
      'create policy %I on public.%I as restrictive for delete to authenticated using (coalesce(auth.jwt()->>''aal'','''')=''aal2'')',
      v_policy,v_table
    );
  end loop;
end;
$$;

comment on policy classes_mfa_update on public.classes is 'Privileged direct table mutations require an AAL2 MFA session; service_role bypasses RLS.';
comment on policy schedule_entries_mfa_update on public.schedule_entries is 'Draft schedule table mutations require an AAL2 MFA session in addition to leadership RLS.';
