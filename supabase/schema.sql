create extension if not exists "pgcrypto";

create table if not exists public.import_batches (
  id text primary key,
  batch_code text not null,
  file_name text not null,
  template_signature text not null,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  submitted_at timestamptz not null default now()
);

alter table public.import_batches
  add column if not exists batch_code text;

update public.import_batches
set batch_code = coalesce(nullif(batch_code, ''), id)
where batch_code is null or batch_code = '';

alter table public.import_batches
  alter column batch_code set not null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null references public.import_batches(id) on delete cascade,
  batch_code text not null,
  template_signature text not null,
  file_name text not null,
  submitted_at timestamptz not null default now(),
  external_code text null,
  sender_name text not null,
  sender_phone text not null,
  sender_address text not null,
  receiver_name text not null,
  receiver_phone text not null,
  receiver_address text not null,
  weight_kg numeric(10, 2) not null check (weight_kg > 0),
  package_count integer not null check (package_count > 0),
  temperature_zone text not null check (temperature_zone in ('常温', '冷藏', '冷冻')),
  remark text null
);

alter table public.orders
  add column if not exists batch_code text;

update public.orders
set batch_code = coalesce(
  nullif(batch_code, ''),
  (
    select ib.batch_code
    from public.import_batches ib
    where ib.id = public.orders.batch_id
  ),
  batch_id
)
where batch_code is null or batch_code = '';

alter table public.orders
  alter column batch_code set not null;

create unique index if not exists orders_external_code_unique
  on public.orders (external_code)
  where external_code is not null and external_code <> '';

create index if not exists orders_receiver_name_idx on public.orders (receiver_name);
create index if not exists orders_batch_code_idx on public.orders (batch_code);
create index if not exists orders_submitted_at_idx on public.orders (submitted_at desc);

create table if not exists public.template_mappings (
  id uuid primary key default gen_random_uuid(),
  template_signature text not null unique,
  sheet_name text not null,
  header_fingerprint text not null,
  mapping_json jsonb not null default '{}'::jsonb,
  hit_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create or replace function public.bump_template_mapping_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.last_used_at = now();
  new.hit_count = coalesce(old.hit_count, 0) + 1;
  return new;
end;
$$;

drop trigger if exists template_mappings_updated_at on public.template_mappings;

create trigger template_mappings_updated_at
before update on public.template_mappings
for each row
execute function public.bump_template_mapping_updated_at();
