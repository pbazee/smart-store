alter table "HomepageCategory" enable row level security;

drop policy if exists "Admins can read homepage categories" on "HomepageCategory";
drop policy if exists "Admins can insert homepage categories" on "HomepageCategory";
drop policy if exists "Admins can update homepage categories" on "HomepageCategory";
drop policy if exists "Admins can delete homepage categories" on "HomepageCategory";

create policy "Admins can read homepage categories"
on "HomepageCategory"
for select
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "Admins can insert homepage categories"
on "HomepageCategory"
for insert
to authenticated
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "Admins can update homepage categories"
on "HomepageCategory"
for update
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "Admins can delete homepage categories"
on "HomepageCategory"
for delete
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
