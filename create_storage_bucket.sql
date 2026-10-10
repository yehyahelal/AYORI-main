-- Create a new storage bucket called 'products'
insert into storage.buckets (id, name, public)
values ('products', 'products', true);

-- Allow public access to view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

-- Allow authenticated users with 'admin' role to insert images
create policy "Admins can insert images"
  on storage.objects for insert
  with check (
    bucket_id = 'products' 
    and exists (
      select 1 from public.user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Allow authenticated users with 'admin' role to update images
create policy "Admins can update images"
  on storage.objects for update
  using (
    bucket_id = 'products' 
    and exists (
      select 1 from public.user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Allow authenticated users with 'admin' role to delete images
create policy "Admins can delete images"
  on storage.objects for delete
  using (
    bucket_id = 'products' 
    and exists (
      select 1 from public.user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );
