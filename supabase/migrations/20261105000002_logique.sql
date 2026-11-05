-- =============================================================
-- Logique métier : triggers, RPC, vues
-- =============================================================

-- Début de journée (heure de Paris) + n jours, à hh heures
create or replace function public.paris_jour(n int, heure int default 9)
returns timestamptz language sql stable set search_path = '' as $$
  select ((date_trunc('day', now() at time zone 'Europe/Paris') + make_interval(days => n, hours => heure)) at time zone 'Europe/Paris')
$$;

-- -------------------------------------------------------------
-- Hôtels : changement d'étape
-- -------------------------------------------------------------
create or replace function public.hotels_avant_maj()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_proba int;
begin
  if tg_op = 'INSERT' then
    if new.etape_id is null then
      select id into new.etape_id from public.etapes_pipeline
       where user_id = new.user_id order by ordre limit 1;
    end if;
    return new;
  end if;

  if new.etape_id is distinct from old.etape_id then
    new.date_entree_etape := now();
    -- Probabilité par défaut de l'étape, sauf si elle a été modifiée dans la même requête
    if new.probabilite = old.probabilite then
      select probabilite_defaut into v_proba from public.etapes_pipeline where id = new.etape_id;
      if v_proba is not null then new.probabilite := v_proba; end if;
    end if;
  end if;
  return new;
end $$;

create trigger hotels_avant_maj before insert or update on public.hotels
for each row execute function public.hotels_avant_maj();

create or replace function public.hotels_apres_maj()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_code text;
  v_ancien_nom text;
  v_nouveau_nom text;
begin
  if tg_op = 'UPDATE' and new.etape_id is not distinct from old.etape_id then
    return null;
  end if;

  select code, nom into v_code, v_nouveau_nom from public.etapes_pipeline where id = new.etape_id;

  if tg_op = 'UPDATE' then
    select nom into v_ancien_nom from public.etapes_pipeline where id = old.etape_id;
    insert into public.interactions (user_id, hotel_id, type, contenu)
    values (new.user_id, new.id, 'changement_etape',
            coalesce(v_ancien_nom, '—') || ' → ' || coalesce(v_nouveau_nom, '—'));
  end if;

  -- Séquence de relance J+3 / J+7 / J+14 après le premier contact
  if v_code = 'contacte' and not exists (
      select 1 from public.relances where hotel_id = new.id and sequence_jour is not null and statut = 'a_faire') then
    insert into public.relances (user_id, hotel_id, type, titre, date_prevue, sequence_jour)
    values
      (new.user_id, new.id, 'linkedin', 'Relance J+3 — ' || new.nom, public.paris_jour(3), 3),
      (new.user_id, new.id, 'email',    'Relance J+7 — ' || new.nom, public.paris_jour(7), 7),
      (new.user_id, new.id, 'appel',    'Relance J+14 — ' || new.nom, public.paris_jour(14), 14);
  end if;

  -- Au-delà de « Contacté » (ou perdu), la séquence restante n'a plus lieu d'être
  if v_code in ('rdv','audit','proposition','negociation','gagne','perdu') then
    update public.relances set statut = 'annule'
     where hotel_id = new.id and sequence_jour is not null and statut = 'a_faire';
  end if;

  -- Gagné : création automatique de la fiche client
  if v_code = 'gagne' then
    insert into public.clients (user_id, hotel_id, date_signature)
    values (new.user_id, new.id, (now() at time zone 'Europe/Paris')::date)
    on conflict (hotel_id) do nothing;
  end if;

  return null;
end $$;

create trigger hotels_apres_maj after insert or update of etape_id on public.hotels
for each row execute function public.hotels_apres_maj();

-- -------------------------------------------------------------
-- Propositions : numéro + totaux
-- -------------------------------------------------------------
create or replace function public.propositions_numero()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_annee text := to_char(now() at time zone 'Europe/Paris', 'YYYY');
  v_max int;
begin
  if new.numero is null or new.numero = '' then
    select coalesce(max(split_part(numero, '-', 3)::int), 0) into v_max
      from public.propositions
     where user_id = new.user_id and numero like 'PROP-' || v_annee || '-%';
    new.numero := 'PROP-' || v_annee || '-' || lpad((v_max + 1)::text, 3, '0');
  end if;
  return new;
end $$;

create trigger propositions_numero before insert on public.propositions
for each row execute function public.propositions_numero();

create or replace function public.recalculer_totaux_proposition(p_id uuid)
returns void language sql set search_path = '' as $$
  update public.propositions p set
    total_setup = round(coalesce((select sum(quantite * prix_setup) from public.lignes_proposition where proposition_id = p_id), 0)
                  * (1 - p.remise_pct / 100), 2),
    total_mensuel = coalesce((select sum(quantite * prix_mensuel) from public.lignes_proposition where proposition_id = p_id), 0)
  where p.id = p_id;
$$;

create or replace function public.lignes_proposition_totaux()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op in ('UPDATE','DELETE') then
    perform public.recalculer_totaux_proposition(old.proposition_id);
  end if;
  if tg_op in ('INSERT','UPDATE') then
    perform public.recalculer_totaux_proposition(new.proposition_id);
  end if;
  return null;
end $$;

create trigger lignes_proposition_totaux after insert or update or delete on public.lignes_proposition
for each row execute function public.lignes_proposition_totaux();

create or replace function public.propositions_remise()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.remise_pct is distinct from old.remise_pct then
    perform public.recalculer_totaux_proposition(new.id);
  end if;
  return null;
end $$;

create trigger propositions_remise after update of remise_pct on public.propositions
for each row execute function public.propositions_remise();

-- Proposition acceptée : hôtel → Gagné, client + automatisations
create or replace function public.propositions_acceptee()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_gagne uuid;
  v_client uuid;
begin
  if new.statut = 'acceptee' and old.statut is distinct from 'acceptee' then
    select id into v_gagne from public.etapes_pipeline where user_id = new.user_id and code = 'gagne';

    update public.hotels set
      etape_id = coalesce(v_gagne, etape_id),
      montant_setup_estime = new.total_setup,
      montant_mensuel_estime = new.total_mensuel
    where id = new.hotel_id;

    insert into public.clients (user_id, hotel_id, proposition_id, date_signature)
    values (new.user_id, new.hotel_id, new.id, (now() at time zone 'Europe/Paris')::date)
    on conflict (hotel_id) do update set proposition_id = excluded.proposition_id
    returning id into v_client;

    insert into public.client_automatisations (user_id, client_id, offre_id, nom, prix_setup, prix_mensuel)
    select new.user_id, v_client, l.offre_id, l.libelle,
           round(l.quantite * l.prix_setup * (1 - new.remise_pct / 100), 2), l.quantite * l.prix_mensuel
      from public.lignes_proposition l
     where l.proposition_id = new.id
       and not exists (select 1 from public.client_automatisations a
                        where a.client_id = v_client and a.nom = l.libelle);
  end if;
  return null;
end $$;

create trigger propositions_acceptee after update of statut on public.propositions
for each row execute function public.propositions_acceptee();

-- -------------------------------------------------------------
-- Activité quotidienne
-- -------------------------------------------------------------
create or replace function public.incrementer_activite(p_metrique text, p_delta int default 1, p_date date default null)
returns public.activite_quotidienne language plpgsql set search_path = '' as $$
declare
  v_date date := coalesce(p_date, (now() at time zone 'Europe/Paris')::date);
  v_row public.activite_quotidienne;
begin
  if p_metrique not in ('linkedin','appels','emails') then
    raise exception 'Métrique inconnue : %', p_metrique;
  end if;
  insert into public.activite_quotidienne (user_id, date) values (auth.uid(), v_date)
  on conflict (user_id, date) do nothing;

  update public.activite_quotidienne set
    linkedin = greatest(0, linkedin + case when p_metrique = 'linkedin' then p_delta else 0 end),
    appels   = greatest(0, appels   + case when p_metrique = 'appels'   then p_delta else 0 end),
    emails   = greatest(0, emails   + case when p_metrique = 'emails'   then p_delta else 0 end)
  where user_id = auth.uid() and date = v_date
  returning * into v_row;
  return v_row;
end $$;

-- Une interaction appel / email / LinkedIn notée compte dans l'activité du jour
create or replace function public.interactions_activite()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_metrique text := case new.type when 'appel' then 'appels' when 'email' then 'emails' when 'linkedin' then 'linkedin' end;
  v_date date := (new.date at time zone 'Europe/Paris')::date;
begin
  if v_metrique is null then return null; end if;
  insert into public.activite_quotidienne (user_id, date) values (new.user_id, v_date)
  on conflict (user_id, date) do nothing;
  update public.activite_quotidienne set
    linkedin = linkedin + (v_metrique = 'linkedin')::int,
    appels   = appels   + (v_metrique = 'appels')::int,
    emails   = emails   + (v_metrique = 'emails')::int
  where user_id = new.user_id and date = v_date;
  return null;
end $$;

create trigger interactions_activite after insert on public.interactions
for each row execute function public.interactions_activite();

-- -------------------------------------------------------------
-- Vues (security_invoker : la RLS des tables s'applique)
-- -------------------------------------------------------------
create view public.v_hotels with (security_invoker = true) as
select
  h.*,
  e.nom   as etape_nom,
  e.code  as etape_code,
  e.ordre as etape_ordre,
  e.couleur as etape_couleur,
  c.id as contact_id,
  nullif(trim(coalesce(c.prenom, '') || ' ' || coalesce(c.nom, '')), '') as contact_nom,
  c.email as contact_email,
  c.telephone as contact_telephone,
  c.linkedin as contact_linkedin,
  r.id as prochaine_action_id,
  r.type as prochaine_action_type,
  r.titre as prochaine_action_titre,
  r.date_prevue as prochaine_action_date,
  cl.id as client_id,
  (h.montant_setup_estime + 12 * h.montant_mensuel_estime) as valeur_annuelle,
  round((h.montant_setup_estime + 12 * h.montant_mensuel_estime) * h.probabilite / 100.0, 2) as valeur_ponderee
from public.hotels h
left join public.etapes_pipeline e on e.id = h.etape_id
left join lateral (
  select * from public.contacts c where c.hotel_id = h.id
  order by c.est_principal desc, c.created_at limit 1
) c on true
left join lateral (
  select * from public.relances r where r.hotel_id = h.id and r.statut = 'a_faire'
  order by r.date_prevue limit 1
) r on true
left join public.clients cl on cl.hotel_id = h.id;

create view public.v_clients with (security_invoker = true) as
select
  cl.*,
  h.nom as hotel_nom, h.ville, h.etoiles, h.nb_chambres, h.site_web,
  coalesce(sum(a.prix_mensuel) filter (where a.statut = 'en_production'), 0) as mrr,
  coalesce(sum(a.prix_setup), 0) as total_setup,
  count(a.id) as nb_automatisations,
  min(a.date_mise_en_service) as premiere_mise_en_service,
  min(a.date_rappel_upsell) filter (where not a.upsell_traite and a.statut = 'en_production') as prochain_upsell
from public.clients cl
join public.hotels h on h.id = cl.hotel_id
left join public.client_automatisations a on a.client_id = cl.id
group by cl.id, h.id;

-- Les fonctions internes ne sont pas exposées
revoke execute on function public.hotels_avant_maj() from public, anon, authenticated;
revoke execute on function public.hotels_apres_maj() from public, anon, authenticated;
revoke execute on function public.propositions_numero() from public, anon, authenticated;
revoke execute on function public.lignes_proposition_totaux() from public, anon, authenticated;
revoke execute on function public.propositions_remise() from public, anon, authenticated;
revoke execute on function public.propositions_acceptee() from public, anon, authenticated;
revoke execute on function public.interactions_activite() from public, anon, authenticated;
revoke execute on function public.incrementer_activite(text, int, date) from public, anon;
grant execute on function public.incrementer_activite(text, int, date) to authenticated;
