-- ============================================================
-- TrustLance - Initial Marketplace Schema
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

create type public.account_type as enum (
    'freelancer',
    'company'
);

create type public.project_status as enum (
    'draft',
    'open',
    'in_progress',
    'completed',
    'cancelled'
);

create type public.application_status as enum (
    'pending',
    'accepted',
    'rejected',
    'withdrawn'
);


-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    wallet_address text not null unique,

    account_type public.account_type not null,

    display_name text,
    avatar_url text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- FREELANCER PROFILES
-- ============================================================

create table public.freelancer_profiles (
    profile_id uuid primary key
        references public.profiles(id)
        on delete cascade,

    headline text,
    bio text,
    experience text,

    hourly_rate numeric(36, 18),

    availability boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- COMPANY PROFILES
-- ============================================================

create table public.company_profiles (
    profile_id uuid primary key
        references public.profiles(id)
        on delete cascade,

    company_name text not null,
    description text,
    industry text,
    website text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- SKILLS
-- ============================================================

create table public.skills (
    id uuid primary key default gen_random_uuid(),

    name text not null unique,

    created_at timestamptz not null default now()
);


-- ============================================================
-- FREELANCER SKILLS
-- ============================================================

create table public.freelancer_skills (
    freelancer_id uuid not null
        references public.freelancer_profiles(profile_id)
        on delete cascade,

    skill_id uuid not null
        references public.skills(id)
        on delete cascade,

    primary key (freelancer_id, skill_id)
);


-- ============================================================
-- PROJECTS
-- ============================================================

create table public.projects (
    id uuid primary key default gen_random_uuid(),

    company_id uuid not null
        references public.company_profiles(profile_id)
        on delete cascade,

    title text not null,

    description text not null,

    budget numeric(36, 18),

    deadline timestamptz,

    status public.project_status not null default 'draft',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- PROJECT SKILLS
-- ============================================================

create table public.project_skills (
    project_id uuid not null
        references public.projects(id)
        on delete cascade,

    skill_id uuid not null
        references public.skills(id)
        on delete cascade,

    primary key (project_id, skill_id)
);


-- ============================================================
-- APPLICATIONS
-- ============================================================

create table public.applications (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null
        references public.projects(id)
        on delete cascade,

    freelancer_id uuid not null
        references public.freelancer_profiles(profile_id)
        on delete cascade,

    proposal text,

    proposed_amount numeric(36, 18),

    status public.application_status not null default 'pending',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint applications_project_freelancer_unique
        unique (project_id, freelancer_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

create index profiles_account_type_idx
    on public.profiles(account_type);

create index freelancer_profiles_availability_idx
    on public.freelancer_profiles(availability);

create index freelancer_skills_skill_id_idx
    on public.freelancer_skills(skill_id);

create index projects_company_id_idx
    on public.projects(company_id);

create index projects_status_idx
    on public.projects(status);

create index projects_deadline_idx
    on public.projects(deadline);

create index project_skills_skill_id_idx
    on public.project_skills(skill_id);

create index applications_project_id_idx
    on public.applications(project_id);

create index applications_freelancer_id_idx
    on public.applications(freelancer_id);

create index applications_status_idx
    on public.applications(status);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

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
for each row
execute function public.set_updated_at();


create trigger freelancer_profiles_set_updated_at
before update on public.freelancer_profiles
for each row
execute function public.set_updated_at();


create trigger company_profiles_set_updated_at
before update on public.company_profiles
for each row
execute function public.set_updated_at();


create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();


create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.freelancer_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.skills enable row level security;
alter table public.freelancer_skills enable row level security;
alter table public.projects enable row level security;
alter table public.project_skills enable row level security;
alter table public.applications enable row level security;


-- ============================================================
-- PROFILES
-- ============================================================

-- Profiles are publicly discoverable.
create policy "profiles_select_public"
on public.profiles
for select
to authenticated
using (true);


-- User can create their own profile.
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);


-- User can modify their own profile.
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- User can delete their own profile.
create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);


-- ============================================================
-- FREELANCER PROFILES
-- ============================================================

create policy "freelancer_profiles_select_authenticated"
on public.freelancer_profiles
for select
to authenticated
using (true);


create policy "freelancer_profiles_insert_own"
on public.freelancer_profiles
for insert
to authenticated
with check (
    auth.uid() = profile_id
);


create policy "freelancer_profiles_update_own"
on public.freelancer_profiles
for update
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);


create policy "freelancer_profiles_delete_own"
on public.freelancer_profiles
for delete
to authenticated
using (auth.uid() = profile_id);


-- ============================================================
-- COMPANY PROFILES
-- ============================================================

create policy "company_profiles_select_authenticated"
on public.company_profiles
for select
to authenticated
using (true);


create policy "company_profiles_insert_own"
on public.company_profiles
for insert
to authenticated
with check (
    auth.uid() = profile_id
);


create policy "company_profiles_update_own"
on public.company_profiles
for update
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);


create policy "company_profiles_delete_own"
on public.company_profiles
for delete
to authenticated
using (auth.uid() = profile_id);


-- ============================================================
-- SKILLS
-- ============================================================

-- Everyone authenticated can discover skills.
create policy "skills_select_authenticated"
on public.skills
for select
to authenticated
using (true);


-- ============================================================
-- FREELANCER SKILLS
-- ============================================================

create policy "freelancer_skills_select_authenticated"
on public.freelancer_skills
for select
to authenticated
using (true);


create policy "freelancer_skills_insert_own"
on public.freelancer_skills
for insert
to authenticated
with check (
    auth.uid() = freelancer_id
);


create policy "freelancer_skills_delete_own"
on public.freelancer_skills
for delete
to authenticated
using (
    auth.uid() = freelancer_id
);


-- ============================================================
-- PROJECTS
-- ============================================================

-- Authenticated users can discover projects.
create policy "projects_select_authenticated"
on public.projects
for select
to authenticated
using (true);


-- Company can create projects belonging to itself.
create policy "projects_insert_own_company"
on public.projects
for insert
to authenticated
with check (
    auth.uid() = company_id
);


-- Company can update its own projects.
create policy "projects_update_own_company"
on public.projects
for update
to authenticated
using (auth.uid() = company_id)
with check (auth.uid() = company_id);


-- Company can delete its own projects.
create policy "projects_delete_own_company"
on public.projects
for delete
to authenticated
using (auth.uid() = company_id);


-- ============================================================
-- PROJECT SKILLS
-- ============================================================

create policy "project_skills_select_authenticated"
on public.project_skills
for select
to authenticated
using (true);


create policy "project_skills_insert_own_project"
on public.project_skills
for insert
to authenticated
with check (
    exists (
        select 1
        from public.projects p
        where p.id = project_id
          and p.company_id = auth.uid()
    )
);


create policy "project_skills_delete_own_project"
on public.project_skills
for delete
to authenticated
using (
    exists (
        select 1
        from public.projects p
        where p.id = project_id
          and p.company_id = auth.uid()
    )
);


-- ============================================================
-- APPLICATIONS
-- ============================================================

-- Authenticated users can see applications.
-- We will tighten this further when private application
-- visibility requirements are finalized.
create policy "applications_select_authenticated"
on public.applications
for select
to authenticated
using (
    auth.uid() = freelancer_id
    or
    exists (
        select 1
        from public.projects p
        where p.id = project_id
          and p.company_id = auth.uid()
    )
);


-- Freelancer can apply to a project.
create policy "applications_insert_own"
on public.applications
for insert
to authenticated
with check (
    auth.uid() = freelancer_id
);


-- Freelancer can modify their own application.
create policy "applications_update_freelancer"
on public.applications
for update
to authenticated
using (auth.uid() = freelancer_id)
with check (auth.uid() = freelancer_id);


-- Company can update an application belonging to its project.
create policy "applications_update_company"
on public.applications
for update
to authenticated
using (
    exists (
        select 1
        from public.projects p
        where p.id = project_id
          and p.company_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.projects p
        where p.id = project_id
          and p.company_id = auth.uid()
    )
);


-- Freelancer can delete/withdraw their own application.
create policy "applications_delete_own"
on public.applications
for delete
to authenticated
using (auth.uid() = freelancer_id);