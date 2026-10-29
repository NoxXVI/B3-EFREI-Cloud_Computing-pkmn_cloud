-- Migration incrémentale pour la base créée avant le script initial.
--
-- Elle ajoute `user_id` à checklist_pokemon, le remplit depuis la checklist
-- parente, puis remplace les politiques RLS par des règles basées sur
-- `user_id = auth.uid()`.
--
-- À exécuter une fois dans le SQL Editor Supabase. Le script est idempotent :
-- il peut être relancé sans erreur.

-- ---------------------------------------------------------------------------
-- user_id sur checklist_pokemon
-- ---------------------------------------------------------------------------

alter table public.checklist_pokemon
  add column if not exists user_id uuid;

update public.checklist_pokemon as cp
set user_id = c.user_id
from public.checklists as c
where cp.checklist_id = c.id
  and cp.user_id is null;

alter table public.checklist_pokemon
  alter column user_id set default auth.uid();

alter table public.checklist_pokemon
  alter column user_id set not null;

alter table public.checklists
  alter column user_id set default auth.uid();

create index if not exists checklists_user_id_idx
  on public.checklists (user_id);

create index if not exists checklist_pokemon_user_id_idx
  on public.checklist_pokemon (user_id);

-- ---------------------------------------------------------------------------
-- Cohérence propriétaire checklist / ligne Pokémon
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'checklists_id_user_id_key'
      and conrelid = 'public.checklists'::regclass
  ) then
    alter table public.checklists
      add constraint checklists_id_user_id_key unique (id, user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'checklist_pokemon_checklist_owner_fkey'
      and conrelid = 'public.checklist_pokemon'::regclass
  ) then
    alter table public.checklist_pokemon
      add constraint checklist_pokemon_checklist_owner_fkey
      foreign key (checklist_id, user_id)
      references public.checklists (id, user_id)
      on delete cascade;
  end if;
end;
$$;

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

drop trigger if exists checklists_set_updated_at on public.checklists;
create trigger checklists_set_updated_at
  before update on public.checklists
  for each row execute function public.set_updated_at();

drop trigger if exists checklist_pokemon_set_updated_at on public.checklist_pokemon;
create trigger checklist_pokemon_set_updated_at
  before update on public.checklist_pokemon
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS : on remplace les policies existantes par des règles user_id
-- ---------------------------------------------------------------------------

alter table public.checklists enable row level security;
alter table public.checklist_pokemon enable row level security;

do $$
declare
  policy record;
begin
  for policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('checklists', 'checklist_pokemon')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      policy.policyname,
      policy.tablename
    );
  end loop;
end;
$$;

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
