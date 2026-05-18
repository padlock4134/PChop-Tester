# Supabase Storage (CRM)

Run the SQL below once in the Supabase SQL Editor to create the `sales-files`
bucket and its access policies.

---

## Bucket creation

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sales-files',
  'sales-files',
  false,
  52428800,  -- 50 MB per file
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'text/plain',
    'text/csv'
  ]
)
on conflict (id) do nothing;
```

## Storage policies

```sql
-- Authenticated users can upload files
create policy "sales_files_upload"
on storage.objects for insert
with check (
  bucket_id = 'sales-files'
  and auth.role() = 'authenticated'
);

-- Authenticated users can read files
-- Row-level access is enforced via revenue.sales_files metadata table
create policy "sales_files_select"
on storage.objects for select
using (
  bucket_id = 'sales-files'
  and auth.role() = 'authenticated'
);

-- Uploaders can delete their own files
create policy "sales_files_delete"
on storage.objects for delete
using (
  bucket_id = 'sales-files'
  and auth.uid() = owner
);
```

---

## Recommended key paths

```
accounts/{account_id}/{filename}
opportunities/{opportunity_id}/{filename}
activities/{activity_id}/{filename}
```

Always insert a matching row into `revenue.sales_files` after uploading
so the metadata table (with its RLS) acts as the real access gate.
