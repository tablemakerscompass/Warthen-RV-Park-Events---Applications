-- ============================================================
--  THE MOTOWN REVIEW — Vendor Applications table
--  Run this in the Supabase SQL editor to create storage.
-- ============================================================

create table if not exists public.vendor_applications (
  id                     uuid primary key default gen_random_uuid(),
  business_name          text not null,
  contact_name           text not null,
  phone                  text not null,
  email                  text not null,
  address                text,
  city                   text,
  state                  text,
  zip                    text,
  website                text,
  facebook               text,
  instagram              text,
  tiktok                 text,
  category               text,
  products               text,
  booth_length           text,
  booth_width            text,
  booth_size             text,
  electricity            text,
  electricity_details    text,
  bringing               text,
  setup_requests         text,
  emergency_name         text,
  emergency_relationship text,
  emergency_phone        text,
  agree_guidelines       boolean default false,
  agree_release          boolean default false,
  signature              text,
  printed_name           text,
  sign_date              date,
  ip_address             text,
  status                 text default 'Pending Review',
  submitted_at           timestamptz default now(),
  created_at             timestamptz default now()
);

-- The serverless function uses the SERVICE ROLE key, which bypasses RLS.
-- We still enable RLS so the table is not publicly readable/writable via the
-- anon/public key.
alter table public.vendor_applications enable row level security;

-- (No anon policies are defined on purpose: only the service role — used
--  server-side in the Vercel function — may read or write this table.)

create index if not exists vendor_applications_submitted_at_idx
  on public.vendor_applications (submitted_at desc);

create index if not exists vendor_applications_status_idx
  on public.vendor_applications (status);
