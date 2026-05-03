do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Employers can delete own jobs'
  ) then
    create policy "Employers can delete own jobs"
      on public.jobs
      for delete
      to authenticated
      using (employer_id = auth.uid());
  end if;
end
$$;
