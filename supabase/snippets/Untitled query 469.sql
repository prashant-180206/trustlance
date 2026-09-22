create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$    
begin
  insert into public.profiles (
    id,
    wallet_address,
    account_type
  )
  values (
    new.id,
    new.raw_user_meta_data->>'wallet_address',
    (new.raw_user_meta_data->>'account_type')::public.account_type
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

drop trigger if exists on_auth_user_created on auth.users;

drop function public.handle_new_user;

-- truncate table auth.users;
