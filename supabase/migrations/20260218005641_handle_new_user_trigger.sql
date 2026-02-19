-- Creates a trigger and function to sync new Supabase Auth users to the custom User table

-- Ensure pgcrypto extension is enabled for gen_random_uuid()
create extension if not exists "pgcrypto";

-- 1. Create the function to insert into your custom User table
create or replace function public.handle_new_user()
returns trigger as $$
begin

  insert into public."User" (
    "id",
    "supabaseId",
    "email",
    "imageURL",
    "hasPaymentMethod"
  )
  values (
    gen_random_uuid(),
    new.id,
    new.email,
    null, -- Profile image can be set from metadata if needed
    false
  )
  on conflict (email) do update
    set "supabaseId" = excluded."supabaseId";

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Create the trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
