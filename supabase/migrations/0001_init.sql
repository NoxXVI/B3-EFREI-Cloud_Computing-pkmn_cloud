-- Schéma initial de Pokémon Cloud.
--
-- À exécuter sur une base Supabase vierge (SQL Editor ou `supabase db push`).
-- Pour une base déjà créée avant ce script, appliquer uniquement
-- 0002_checklist_pokemon_user_id.sql.
--
-- Chaque table porte un `user_id` relié à auth.users. Les politiques RLS
-- garantissent qu'un utilisateur ne lit et ne modifie que ses propres lignes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null,
  game_key text not null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklists_name_not_blank check (length(btrim(name)) > 0),
  -- Nécessaire pour la clé étrangère composite de checklist_pokemon.
  constraint checklists_id_user_id_key unique (id, user_id)
);

create table public.checklist_pokemon (
  checklist_id uuid not null,
  user_id uuid not null default auth.uid(),
  pokemon_api_id integer not null check (pokemon_api_id > 0),
  is_captured boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (checklist_id, pokemon_api_id),
  -- Le user_id de la ligne doit être celui du propriétaire de la checklist.
  constraint checklist_pokemon_checklist_owner_fkey
    foreign key (checklist_id, user_id)
    references public.checklists (id, user_id)
    on delete cascade
);

create index checklists_user_id_idx on public.checklists (user_id);
create index checklist_pokemon_user_id_idx on public.checklist_pokemon (user_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger checklists_set_updated_at
  before update on public.checklists
  for each row execute function public.set_updated_at();

create trigger checklist_pokemon_set_updated_at
  before update on public.checklist_pokemon
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.checklists enable row level security;
alter table public.checklist_pokemon enable row level security;

create policy checklists_select_own
  on public.checklists for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy checklists_insert_own
  on public.checklists for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy checklists_update_own
  on public.checklists for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy checklists_delete_own
  on public.checklists for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy checklist_pokemon_select_own
  on public.checklist_pokemon for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy checklist_pokemon_insert_own
  on public.checklist_pokemon for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy checklist_pokemon_update_own
  on public.checklist_pokemon for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy checklist_pokemon_delete_own
  on public.checklist_pokemon for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Privilèges
-- ---------------------------------------------------------------------------

revoke all on public.checklists from anon;
revoke all on public.checklist_pokemon from anon;

grant select, insert, update, delete on public.checklists to authenticated;
grant select, insert, update, delete on public.checklist_pokemon to authenticated;
