-- =============================================================
-- CRM Hôtels — schéma principal
-- Toutes les tables portent user_id (default auth.uid()) + RLS.
-- =============================================================

create extension if not exists unaccent with schema extensions;

-- Fonction utilitaire : mise à jour de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Normalisation pour la détection de doublons (immutable pour colonne générée)
create or replace function public.normaliser(txt text)
returns text language sql immutable parallel safe
set search_path = '' as $$
  select regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(txt, ''))), '[^a-z0-9]+', '', 'g')
$$;

-- -------------------------------------------------------------
-- Paramétrage
-- -------------------------------------------------------------
create table public.profils (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  nom_complet text,
  raison_sociale text,
  siret text,
  adresse text,
  email text,
  telephone text,
  site_web text,
  logo_url text,
  mention_tva text default 'TVA non applicable, art. 293 B du CGI',
  iban text,
  conditions_paiement text default '50 % à la commande, solde à la mise en service. Maintenance facturée mensuellement.',
  validite_devis_jours int default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.etapes_pipeline (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nom text not null,
  code text check (code in ('nouveau','contacte','rdv','audit','proposition','negociation','gagne','perdu')),
  ordre int not null default 0,
  couleur text not null default 'slate',
  probabilite_defaut int not null default 10 check (probabilite_defaut between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

create table public.listes_valeurs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  categorie text not null check (categorie in ('source','douleur','service','pms')),
  valeur text not null,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, categorie, valeur)
);

-- -------------------------------------------------------------
-- Prospection
-- -------------------------------------------------------------
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nom text not null,
  adresse text,
  code_postal text,
  ville text,
  departement text,
  site_web text,
  url_booking text,
  url_google_maps text,
  etoiles smallint check (etoiles between 1 and 5),
  nb_chambres int check (nb_chambres >= 0),
  type_hotel text check (type_hotel in ('independant','groupe','franchise','residence','camping_premium')),
  services text[] not null default '{}',
  ouverture text not null default 'annuelle' check (ouverture in ('annuelle','saisonniere')),
  mois_haute_saison smallint[] not null default '{}',
  mois_creux smallint[] not null default '{}',
  note_google numeric(2,1) check (note_google between 0 and 5),
  nb_avis_google int,
  note_booking numeric(3,1) check (note_booking between 0 and 10),
  nb_avis_booking int,
  pms text,
  channel_manager text,
  moteur_reservation text,
  crm text,
  source text,
  etape_id uuid references public.etapes_pipeline on delete set null,
  date_entree_etape timestamptz not null default now(),
  priorite text not null default 'moyenne' check (priorite in ('haute','moyenne','basse')),
  montant_setup_estime numeric(10,2) not null default 0,
  montant_mensuel_estime numeric(10,2) not null default 0,
  probabilite int not null default 10 check (probabilite between 0 and 100),
  douleurs text[] not null default '{}',
  raison_perte text check (raison_perte in ('prix','timing','saison','pas_interesse','concurrent','autre')),
  detail_perte text,
  date_recontact date,
  cle_doublon text generated always as (public.normaliser(nom) || '|' || public.normaliser(ville)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index hotels_user_idx on public.hotels(user_id);
create index hotels_etape_idx on public.hotels(etape_id);
create index hotels_doublon_idx on public.hotels(user_id, cle_doublon);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  hotel_id uuid not null references public.hotels on delete cascade,
  prenom text,
  nom text,
  poste text check (poste in ('directeur','proprietaire','reception','revenue_manager','marketing','autre')),
  role_decision text check (role_decision in ('decideur','influenceur','utilisateur')),
  email text,
  telephone text,
  linkedin text,
  est_principal boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_hotel_idx on public.contacts(hotel_id);
create index contacts_user_idx on public.contacts(user_id);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  hotel_id uuid not null references public.hotels on delete cascade,
  contact_id uuid references public.contacts on delete set null,
  type text not null default 'note' check (type in ('note','appel','email','linkedin','whatsapp','rdv','changement_etape')),
  contenu text not null default '',
  date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index interactions_hotel_idx on public.interactions(hotel_id, date desc);
create index interactions_user_idx on public.interactions(user_id);
create index interactions_contact_idx on public.interactions(contact_id);

create table public.relances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  hotel_id uuid not null references public.hotels on delete cascade,
  contact_id uuid references public.contacts on delete set null,
  type text not null default 'appel' check (type in ('appel','email','linkedin','rdv','autre')),
  titre text not null,
  date_prevue timestamptz not null,
  duree_min int,
  lieu_ou_lien text,
  statut text not null default 'a_faire' check (statut in ('a_faire','fait','annule')),
  fait_le timestamptz,
  sequence_jour smallint check (sequence_jour in (3,7,14)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index relances_user_date_idx on public.relances(user_id, statut, date_prevue);
create index relances_hotel_idx on public.relances(hotel_id);
create index relances_contact_idx on public.relances(contact_id);

-- -------------------------------------------------------------
-- Commercial
-- -------------------------------------------------------------
create table public.offres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nom text not null,
  categorie text,
  description text,
  prix_setup_indicatif numeric(10,2) not null default 0,
  prix_mensuel_indicatif numeric(10,2) not null default 0,
  gain_estime text,
  duree_mise_en_place text,
  douleurs_associees text[] not null default '{}',
  actif boolean not null default true,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index offres_user_idx on public.offres(user_id);

create table public.modeles_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  canal text not null check (canal in ('linkedin_invitation','linkedin_message','linkedin_relance','email_froid','email_relance','script_appel')),
  titre text not null,
  objet text,
  contenu text not null,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index modeles_user_idx on public.modeles_messages(user_id);

create table public.propositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  hotel_id uuid not null references public.hotels on delete cascade,
  numero text,
  titre text not null default 'Proposition d''automatisation',
  statut text not null default 'brouillon' check (statut in ('brouillon','envoyee','acceptee','refusee')),
  date_envoi date,
  date_validite date,
  introduction text,
  conditions text,
  remise_pct numeric(5,2) not null default 0 check (remise_pct between 0 and 100),
  total_setup numeric(10,2) not null default 0,
  total_mensuel numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, numero)
);
create index propositions_user_idx on public.propositions(user_id);
create index propositions_hotel_idx on public.propositions(hotel_id);

create table public.lignes_proposition (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  proposition_id uuid not null references public.propositions on delete cascade,
  offre_id uuid references public.offres on delete set null,
  libelle text not null,
  description text,
  quantite int not null default 1 check (quantite > 0),
  prix_setup numeric(10,2) not null default 0,
  prix_mensuel numeric(10,2) not null default 0,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lignes_prop_idx on public.lignes_proposition(proposition_id);
create index lignes_user_idx on public.lignes_proposition(user_id);
create index lignes_offre_idx on public.lignes_proposition(offre_id);

-- -------------------------------------------------------------
-- Clients
-- -------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  hotel_id uuid not null unique references public.hotels on delete cascade,
  proposition_id uuid references public.propositions on delete set null,
  date_signature date not null default current_date,
  statut text not null default 'actif' check (statut in ('actif','pause','resilie')),
  date_renouvellement date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_user_idx on public.clients(user_id);
create index clients_prop_idx on public.clients(proposition_id);

create table public.client_automatisations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid not null references public.clients on delete cascade,
  offre_id uuid references public.offres on delete set null,
  nom text not null,
  statut text not null default 'en_cours' check (statut in ('en_cours','en_production','arretee')),
  date_livraison date,
  date_mise_en_service date,
  prix_setup numeric(10,2) not null default 0,
  prix_mensuel numeric(10,2) not null default 0,
  date_rappel_upsell date generated always as ((date_mise_en_service + interval '3 months')::date) stored,
  upsell_traite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_auto_client_idx on public.client_automatisations(client_id);
create index client_auto_user_idx on public.client_automatisations(user_id);
create index client_auto_offre_idx on public.client_automatisations(offre_id);

-- -------------------------------------------------------------
-- Pilotage
-- -------------------------------------------------------------
create table public.objectifs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  periode text not null check (periode in ('quotidien','mensuel')),
  metrique text not null check (metrique in ('linkedin','appels','emails','rdv','signatures','ca')),
  valeur_cible numeric(12,2) not null default 0,
  mois date, -- null = objectif par défaut ; sinon 1er jour du mois concerné
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index objectifs_unique_idx on public.objectifs(user_id, periode, metrique, coalesce(mois, '1900-01-01'::date));

create table public.activite_quotidienne (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  linkedin int not null default 0,
  appels int not null default 0,
  emails int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- -------------------------------------------------------------
-- updated_at + RLS sur toutes les tables
-- -------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profils','etapes_pipeline','listes_valeurs','hotels','contacts','interactions','relances',
    'offres','modeles_messages','propositions','lignes_proposition','clients','client_automatisations','objectifs','activite_quotidienne']
  loop
    execute format('create trigger %1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "proprietaire_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "proprietaire_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "proprietaire_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "proprietaire_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)$p$, t);
  end loop;
end $$;
