-- Run the entire script as postgres in Supabase SQL Editor.
-- Copies schema and CURRENT policies into a temporary table, never real rows.
-- No auth accounts are created. All fixtures, grants and DDL are rolled back.
-- Tests database CRUD ownership, not JWT verification, RPCs or TRUNCATE rights.
begin;
set local statement_timeout = '15s';

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.moods'::regclass) then
    raise exception 'FAIL: public.moods must have RLS enabled';
  end if;
  if exists (select 1 from pg_roles where rolname in ('anon', 'authenticated')
             and (rolsuper or rolbypassrls)) then
    raise exception 'FAIL: API roles must not bypass RLS';
  end if;
  if exists (select 1 from pg_class where oid = 'public.moods'::regclass
             and pg_get_userbyid(relowner) in ('anon', 'authenticated')) then
    raise exception 'FAIL: API roles must not own the table';
  end if;
end;
$$;

create temporary table moods_rls_probe (like public.moods including all) on commit drop;
alter table pg_temp.moods_rls_probe enable row level security;

do $$
declare
  p record;
  role_list text;
  api_role text;
  privilege text;
begin
  for p in select * from pg_policies where schemaname = 'public' and tablename = 'moods' loop
    select string_agg(case when r = 'public' then 'PUBLIC' else quote_ident(r) end, ', ')
      into role_list from unnest(p.roles) r;
    execute format('create policy %I on pg_temp.moods_rls_probe as %s for %s to %s%s%s',
      p.policyname, p.permissive, p.cmd, role_list,
      case when p.qual is null then '' else ' using (' || p.qual || ')' end,
      case when p.with_check is null then '' else ' with check (' || p.with_check || ')' end);
  end loop;
  -- Mirror effective CRUD permissions, including inherited grants.
  foreach api_role in array array['anon', 'authenticated'] loop
    foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      if has_table_privilege(api_role, 'public.moods', privilege) then
        execute format('grant %s on pg_temp.moods_rls_probe to %I', privilege, api_role);
      end if;
    end loop;
  end loop;
end;
$$;

-- LIKE does not copy foreign keys; synthetic IDs never need auth.users rows.
insert into pg_temp.moods_rls_probe (user_id, date, mood, note) values
  ('00000000-0000-4000-8000-000000000001', '2000-01-01', 'A', 'A fixture'),
  ('00000000-0000-4000-8000-000000000002', '2000-01-01', 'B', 'B fixture');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare affected integer;
begin
  if (select count(*) from pg_temp.moods_rls_probe) <> 1 or
     (select note from pg_temp.moods_rls_probe limit 1) <> 'A fixture' then
    raise exception 'FAIL: A must see only A rows';
  end if;

  update pg_temp.moods_rls_probe set note = 'forged'
    where user_id = '00000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-user UPDATE'; end if;
  delete from pg_temp.moods_rls_probe where user_id = '00000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-user DELETE'; end if;

  begin
    insert into pg_temp.moods_rls_probe (user_id, date, mood)
      values ('00000000-0000-4000-8000-000000000002', '2000-01-02', 'F');
    raise exception 'FAIL: forged INSERT succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    -- Use an unused date so a uniqueness error cannot mask a missing RLS check.
    update pg_temp.moods_rls_probe
      set user_id = '00000000-0000-4000-8000-000000000002', date = '2000-01-04'
      where user_id = auth.uid();
    raise exception 'FAIL: ownership reassignment succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into pg_temp.moods_rls_probe (user_id, date, mood)
      values ('00000000-0000-4000-8000-000000000002', '2000-01-01', 'F')
      on conflict (user_id, date) do update set mood = excluded.mood;
    raise exception 'FAIL: forged UPSERT succeeded';
  exception when insufficient_privilege then null;
  end;

  insert into pg_temp.moods_rls_probe (user_id, date, mood)
    values ('00000000-0000-4000-8000-000000000001', '2000-01-02', 'C');
  insert into pg_temp.moods_rls_probe (user_id, date, mood)
    values ('00000000-0000-4000-8000-000000000001', '2000-01-02', 'A')
    on conflict (user_id, date) do update set mood = excluded.mood;
  if (select mood from pg_temp.moods_rls_probe where date = '2000-01-02') <> 'A' then
    raise exception 'FAIL: own UPSERT';
  end if;
  update pg_temp.moods_rls_probe set note = 'own update' where date = '2000-01-02';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL: own UPDATE'; end if;
  delete from pg_temp.moods_rls_probe where date = '2000-01-02';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL: own DELETE'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from pg_temp.moods_rls_probe) <> 1 or
     (select note from pg_temp.moods_rls_probe limit 1) <> 'B fixture' then
    raise exception 'FAIL: B must see only its unchanged row';
  end if;
end;
$$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare affected integer;
begin
  -- Lack of table privileges also counts as denial for anonymous requests.
  begin
    if exists (select 1 from pg_temp.moods_rls_probe) then
      raise exception 'FAIL: anonymous SELECT';
    end if;
  exception when insufficient_privilege then null;
  end;
  begin
    insert into pg_temp.moods_rls_probe (user_id, date, mood)
      values ('00000000-0000-4000-8000-000000000001', '2000-01-03', 'F');
    raise exception 'FAIL: anonymous INSERT';
  exception when insufficient_privilege then null;
  end;
  begin
    update pg_temp.moods_rls_probe set note = 'anonymous';
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'FAIL: anonymous UPDATE'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    delete from pg_temp.moods_rls_probe;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'FAIL: anonymous DELETE'; end if;
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: mood CRUD ownership, forged writes, upserts and anonymous access' as result;
