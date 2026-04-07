-- Keep the auth -> app user sync trigger resilient when names are blank or
-- when the same email is materialized more than once during local resets.
create or replace function public.handle_new_user()
returns trigger as $$
declare
    normalized_email text;
    email_local_part text;
    derived_first_name text;
    derived_last_name text;
begin
    normalized_email := lower(trim(coalesce(new.email, '')));

    if normalized_email = '' then
        return new;
    end if;

    email_local_part := split_part(normalized_email, '@', 1);
    derived_first_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
        initcap(
            nullif(
                split_part(
                    regexp_replace(coalesce(email_local_part, ''), '[_-]', '.', 'g'),
                    '.',
                    1
                ),
                ''
            )
        ),
        'Movie'
    );
    derived_last_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'last_name'), ''),
        initcap(
            nullif(
                trim(
                    regexp_replace(
                        regexp_replace(coalesce(email_local_part, ''), '^[^._-]+', ''),
                        '[._-]+',
                        ' ',
                        'g'
                    )
                ),
                ''
            )
        ),
        'Fan'
    );

    insert into public."User" (
        "id",
        "supabaseId",
        "firstName",
        "lastName",
        "email",
        "imageURL",
        "cardNumber"
    )
    values (
        gen_random_uuid(),
        new.id,
        derived_first_name,
        derived_last_name,
        normalized_email,
        null,
        null
    )
    on conflict ("email") do update
    set
        "supabaseId" = excluded."supabaseId",
        "firstName" = excluded."firstName",
        "lastName" = excluded."lastName";

    return new;
end;
$$ language plpgsql security definer set search_path = public;
