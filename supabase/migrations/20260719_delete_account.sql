-- Account deletion RPC (P0-5)
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor).
--
-- Deletes the calling user's mood rows and their auth account in one
-- transaction. SECURITY DEFINER lets it touch auth.users, which the
-- anon/authenticated roles cannot do directly; auth.uid() scopes it
-- strictly to the caller's own account.

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.moods where user_id = caller;
  delete from auth.users where id = caller;
end;
$$;

-- Only signed-in users may call it.
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
