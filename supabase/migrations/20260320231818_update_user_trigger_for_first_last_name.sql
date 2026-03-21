-- Update the user creation trigger to parse firstName and lastName from raw_user_meta_data
create or replace function public.handle_new_user()
returns trigger as $$
begin

  insert into public."User" (
    "id",
    "supabaseId",
    "firstName",
    "lastName",
    "email",
    "imageURL",
    "hasPaymentMethod"
  )
  values (
    gen_random_uuid(),
    new.id,
    -- Extract from metadata, fallback to empty string since they are required in Prisma
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    null,
    false
  )
  on conflict (email) do update
    set 
        "supabaseId" = excluded."supabaseId",
        "firstName" = excluded."firstName",
        "lastName" = excluded."lastName";

  return new;
end;
$$ language plpgsql security definer set search_path = public;