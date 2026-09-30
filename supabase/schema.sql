-- Schema per quando HE@LTY passerà dall'archivio nel browser a Supabase.
-- Da creare in un progetto Supabase con regione UE (dati sanitari, GDPR art. 9).
-- Ogni tabella è protetta da Row Level Security: ognuno vede solo i propri dati.

create table profili (
  id uuid primary key references auth.users on delete cascade,
  nome text,
  anno_nascita int,
  sesso text check (sesso in ('M', 'F')),
  peso_kg numeric(5,1),
  altezza_cm numeric(5,1),
  attivita text not null default 'moderato',
  integratori text[] not null default '{}',
  gravidanza boolean not null default false,
  restrizione_liquidi boolean not null default false,
  disturbi_alimentari boolean not null default false,
  consenso_dati_sanitari_at timestamptz,
  aggiornato_at timestamptz not null default now()
);

create table giorni (
  utente_id uuid not null references auth.users on delete cascade,
  data date not null,
  acqua_ml int not null default 0,
  minuti_attivita int not null default 0,
  passi int,
  ore_sonno numeric(3,1),
  integratori_presi text[] not null default '{}',
  primary key (utente_id, data)
);

create table pasti (
  id uuid primary key default gen_random_uuid(),
  utente_id uuid not null references auth.users on delete cascade,
  data date not null,
  ora time not null,
  descrizione text not null,
  kcal int
);

-- Dati importati dai wearable (Oura, Withings, Fitbit...), uno per metrica e giorno.
create table misure_wearable (
  utente_id uuid not null references auth.users on delete cascade,
  fonte text not null,
  metrica text not null,
  data date not null,
  valore numeric not null,
  primary key (utente_id, fonte, metrica, data)
);

alter table profili enable row level security;
alter table giorni enable row level security;
alter table pasti enable row level security;
alter table misure_wearable enable row level security;

create policy "solo i propri dati" on profili for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "solo i propri dati" on giorni for all using (auth.uid() = utente_id) with check (auth.uid() = utente_id);
create policy "solo i propri dati" on pasti for all using (auth.uid() = utente_id) with check (auth.uid() = utente_id);
create policy "solo i propri dati" on misure_wearable for all using (auth.uid() = utente_id) with check (auth.uid() = utente_id);
