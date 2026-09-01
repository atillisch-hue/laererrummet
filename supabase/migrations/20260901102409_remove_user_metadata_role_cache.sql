-- Stop deriving even cached profile roles from user-editable metadata.
create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path='public'
as $$
begin
  insert into public.user_profiles(user_id,display_name,role)
  values(
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      new.email,
      'Bruger'
    ),
    case
      when new.raw_app_meta_data ->> 'role' in ('teacher','admin','board','parent','student')
      then new.raw_app_meta_data ->> 'role'
      else 'teacher'
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.create_user_profile() from public,anon,authenticated;
