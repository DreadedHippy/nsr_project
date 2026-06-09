create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'agent');
create type public.account_status as enum ('invited', 'active', 'deactivated');
create type public.verification_outcome as enum ('verified', 'not_verified');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'agent',
  status public.account_status not null default 'invited',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  role public.user_role not null default 'agent',
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.nsr_records (
  id uuid primary key default gen_random_uuid(),
  social_register_id text not null unique,
  nin_encrypted text not null,
  nin_hash text not null unique,
  full_name text,
  state text,
  lga text,
  created_at timestamptz not null default now()
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id),
  nin_encrypted text not null,
  nin_hash text not null,
  nin_masked text not null,
  outcome public.verification_outcome not null,
  reason_code text,
  nimc_payload_encrypted text,
  nimc_identity jsonb,
  created_at timestamptz not null default now()
);

create table public.feedback_records (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null unique references public.verification_records(id),
  agent_id uuid not null references public.profiles(id),
  social_register_id text not null references public.nsr_records(social_register_id),
  nin_encrypted text not null,
  nin_hash text not null,
  nin_masked text not null,
  outcome public.verification_outcome not null,
  comment text not null check (char_length(comment) between 10 and 1000),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_role_status_idx on public.profiles(role, status);
create index verification_records_agent_created_idx on public.verification_records(agent_id, created_at desc);
create index verification_records_nin_hash_idx on public.verification_records(nin_hash);
create index feedback_records_agent_created_idx on public.feedback_records(agent_id, created_at desc);
create index feedback_records_outcome_created_idx on public.feedback_records(outcome, created_at desc);
create index feedback_records_nin_hash_idx on public.feedback_records(nin_hash);
create index feedback_records_social_register_idx on public.feedback_records(social_register_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.prevent_feedback_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Feedback records are immutable';
end;
$$;

create trigger feedback_records_no_update
before update on public.feedback_records
for each row execute function public.prevent_feedback_changes();

create trigger feedback_records_no_delete
before delete on public.feedback_records
for each row execute function public.prevent_feedback_changes();

alter table public.profiles enable row level security;
alter table public.agent_invitations enable row level security;
alter table public.nsr_records enable row level security;
alter table public.verification_records enable row level security;
alter table public.feedback_records enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles are visible to self or admins"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "admins manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage invitations"
on public.agent_invitations for all
using (public.is_admin())
with check (public.is_admin());

create policy "active users can read nsr records"
on public.nsr_records for select
using (public.current_user_role() in ('admin', 'agent'));

create policy "admins manage nsr records"
on public.nsr_records for all
using (public.is_admin())
with check (public.is_admin());

create policy "agents can insert own verifications"
on public.verification_records for insert
with check (agent_id = auth.uid() and public.current_user_role() = 'agent');

create policy "verifications visible to owner or admins"
on public.verification_records for select
using (agent_id = auth.uid() or public.is_admin());

create policy "agents can insert own feedback"
on public.feedback_records for insert
with check (agent_id = auth.uid() and public.current_user_role() = 'agent');

create policy "feedback visible to owner or admins"
on public.feedback_records for select
using (agent_id = auth.uid() or public.is_admin());

create policy "audit logs visible to admins"
on public.audit_logs for select
using (public.is_admin());

create policy "admins insert audit logs"
on public.audit_logs for insert
with check (public.is_admin());
