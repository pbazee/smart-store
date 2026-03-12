alter table "AnnouncementMessage" enable row level security;

drop policy if exists "Admins can read announcements" on "AnnouncementMessage";
drop policy if exists "Admins can insert announcements" on "AnnouncementMessage";
drop policy if exists "Admins can update announcements" on "AnnouncementMessage";
drop policy if exists "Admins can delete announcements" on "AnnouncementMessage";

create policy "Admins can read announcements"
on "AnnouncementMessage"
for select
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "Admins can insert announcements"
on "AnnouncementMessage"
for insert
to authenticated
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "Admins can update announcements"
on "AnnouncementMessage"
for update
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "Admins can delete announcements"
on "AnnouncementMessage"
for delete
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
