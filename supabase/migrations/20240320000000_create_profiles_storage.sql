-- Create a storage bucket for profile pictures
insert into storage.buckets (id, name, public) values ('profiles', 'profiles', true);

-- Allow authenticated users to upload their own profile pictures
create policy "Users can upload their own profile pictures"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow public access to view profile pictures
create policy "Profile pictures are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'profiles');

-- Allow users to update their own profile pictures
create policy "Users can update their own profile pictures"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
with check (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to delete their own profile pictures
create policy "Users can delete their own profile pictures"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[2]
); 