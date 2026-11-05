-- =============================================================
-- Données de démo : 20 hôtels fictifs (Alpes-Maritimes / Var),
-- 3 clients signés, relances, propositions, historique d'activité.
-- Appel : select public.charger_donnees_demo();  (depuis l'app, Paramètres)
-- Toutes les adresses, emails et téléphones sont fictifs.
-- =============================================================

create or replace function public.charger_donnees_demo()
returns void language plpgsql set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  r record;
  v_id uuid;
  v_ids jsonb := '{}'::jsonb;
  v_etape uuid;
  v_slug text;
  v_client uuid;
  v_prop uuid;
  d int;
begin
  if v_uid is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  -- Repart d'une base propre (les offres, modèles et paramètres sont conservés)
  delete from public.hotels where user_id = v_uid;
  delete from public.activite_quotidienne where user_id = v_uid;

  -- ---------------------------------------------------------- hôtels
  for r in
    select * from (values
      ( 1,'Hôtel Les Pins Parasols','Hyères','83400','Var',3,28,'independant',array['Restaurant','Piscine','Parking'],'saisonniere',array[6,7,8],array[4,10],4.3,312,8.4,540,'Medialog','Google Maps','nouveau','moyenne',2500,290,array['Appels manqués','Avis sans réponse'],5,'12 avenue des Pins'),
      ( 2,'La Bastide des Oliviers','Mougins','06250','Alpes-Maritimes',4,18,'independant',array['Restaurant','Spa','Piscine'],'annuelle',array[5,6,7,8,9],array[11,1,2],4.6,280,9.1,410,'Cloudbeds','LinkedIn','nouveau','haute',3500,380,array['Upsell inexistant','Dépendance aux OTA'],3,'4 chemin des Oliviers'),
      ( 3,'Hôtel du Petit Port','Bandol','83150','Var',2,22,'independant',array['Bar'],'annuelle',array[7,8],array[11,12,1],4.0,190,7.9,620,'Misterbooking','Google Maps','nouveau','basse',900,90,array['Avis sans réponse'],12,'8 quai du Port'),
      ( 4,'Résidence Azur Village','Fréjus','83600','Var',null,64,'residence',array['Piscine','Parking'],'saisonniere',array[7,8],array[4,5,10],4.1,520,8.0,1100,'Autre','Google Maps','nouveau','moyenne',2000,190,array['Emails répétitifs','Check-in manuel'],20,'210 boulevard de la Mer'),
      ( 5,'Hôtel Belle Rive Plage','Sainte-Maxime','83120','Var',3,35,'independant',array['Restaurant','Plage privée','Bar'],'saisonniere',array[6,7,8],array[4,10],4.4,640,8.6,980,'Mews','LinkedIn','contacte','haute',2500,290,array['Appels manqués'],40,'45 promenade de la Plage'),
      ( 6,'Le Mas des Lavandes','Grasse','06130','Alpes-Maritimes',3,15,'independant',array['Piscine','Restaurant'],'annuelle',array[6,7,8],array[11,1,2],4.7,150,9.2,220,'Cloudbeds','Email à froid','contacte','moyenne',1500,120,array['Upsell inexistant'],25,'17 route des Lavandes'),
      ( 7,'Hôtel Riviera Centre','Nice','06000','Alpes-Maritimes',3,52,'groupe',array['Bar','Salle de sport'],'annuelle',array[5,6,7,8,9],array[11,1,2],4.2,1450,8.3,2600,'Opera','LinkedIn','contacte','haute',4000,350,array['Saisie entre logiciels','Appels manqués'],18,'30 rue de la Riviera'),
      ( 8,'Camping Les Criques d''Or','Le Lavandou','83980','Var',5,180,'camping_premium',array['Piscine','Restaurant','Animaux acceptés'],'saisonniere',array[7,8],array[4,5,9],4.5,980,8.8,700,'Autre','Salon / événement','contacte','moyenne',2000,190,array['Appels manqués','Emails répétitifs'],8,'Route des Criques'),
      ( 9,'Villa Mimosa','Antibes','06600','Alpes-Maritimes',4,24,'independant',array['Spa','Piscine','Restaurant'],'annuelle',array[6,7,8,9],array[11,1,2],4.5,420,9.0,690,'Mews','Recommandation','rdv','haute',3000,300,array['Avis sans réponse','Upsell inexistant'],30,'9 boulevard des Mimosas'),
      (10,'Hôtel Le Cap Bleu','Saint-Raphaël','83700','Var',3,40,'franchise',array['Bar','Parking','Séminaires'],'annuelle',array[7,8],array[11,12,1],4.0,870,8.1,1500,'Opera','LinkedIn','rdv','moyenne',2500,240,array['Saisie entre logiciels','Emails répétitifs'],35,'2 avenue du Cap'),
      (11,'Domaine des Roches Rouges','Mandelieu-la-Napoule','06210','Alpes-Maritimes',4,60,'independant',array['Séminaires','Spa','Restaurant','Piscine'],'annuelle',array[5,6,9],array[12,1],4.4,1100,8.7,1300,'Medialog','Recommandation','audit','haute',4500,420,array['Emails répétitifs','Saisie entre logiciels','Appels manqués'],50,'1 allée des Roches Rouges'),
      (12,'Hôtel La Pinède Dorée','Saint-Tropez','83990','Var',5,30,'independant',array['Spa','Plage privée','Restaurant','Navette'],'saisonniere',array[6,7,8],array[4,10],4.6,520,9.3,480,'Opera','Réseau personnel','audit','haute',6000,550,array['Upsell inexistant','Appels manqués','Avis sans réponse'],60,'Chemin de la Pinède'),
      (13,'Hôtel Côté Sud','Cannes','06400','Alpes-Maritimes',3,45,'independant',array['Bar','Parking'],'annuelle',array[5,7,8],array[11,1],4.1,980,8.2,2100,'Cloudbeds','LinkedIn','proposition','moyenne',3400,380,array['Appels manqués','Avis sans réponse'],55,'14 rue du Midi'),
      (14,'Les Terrasses de Garavan','Menton','06500','Alpes-Maritimes',3,26,'independant',array['Restaurant'],'annuelle',array[2,7,8],array[11,12],4.3,360,8.5,740,'Medialog','Google Maps','proposition','moyenne',2700,210,array['Upsell inexistant','Emails répétitifs'],45,'6 montée des Terrasses'),
      (15,'Grand Hôtel de la Rade','Toulon','83000','Var',4,85,'groupe',array['Séminaires','Restaurant','Salle de sport','Parking'],'annuelle',array[6,7,8],array[12,1,2],4.2,1900,8.4,2900,'Opera','Salon / événement','negociation','haute',5500,480,array['Saisie entre logiciels','Emails répétitifs','Appels manqués'],75,'55 avenue de la Rade'),
      (16,'Hôtel Le Jardin de la Darse','Villefranche-sur-Mer','06230','Alpes-Maritimes',3,20,'independant',array['Restaurant'],'annuelle',array[6,7,8],array[11,1],4.6,510,9.0,880,'Cloudbeds','Recommandation','gagne','moyenne',2500,290,array['Appels manqués'],150,'3 rue de la Darse'),
      (17,'Hôtel Les Voiles Blanches','Sanary-sur-Mer','83110','Var',3,32,'independant',array['Bar','Piscine'],'annuelle',array[7,8],array[11,12,1],4.4,700,8.6,1200,'Medialog','LinkedIn','gagne','moyenne',2400,210,array['Avis sans réponse','Upsell inexistant'],120,'21 quai des Voiliers'),
      (18,'Résidence Les Suites du Cros','Cagnes-sur-Mer','06800','Alpes-Maritimes',4,48,'residence',array['Piscine','Parking','Salle de sport'],'annuelle',array[6,7,8],array[11,1,2],4.3,890,8.7,1600,'Mews','Google Maps','gagne','haute',4500,380,array['Check-in manuel','Saisie entre logiciels','Emails répétitifs'],100,'88 avenue du Cros'),
      (19,'Hôtel Saint-Roch','Draguignan','83300','Var',2,18,'independant',array['Parking'],'annuelle',array[7,8],array[11,1],3.9,210,7.6,400,'Autre','Appel à froid','perdu','basse',900,90,array['Avis sans réponse'],90,'5 place Saint-Roch'),
      (20,'Hôtel Belvédère des Cimes','Èze','06360','Alpes-Maritimes',4,22,'independant',array['Restaurant','Spa'],'saisonniere',array[5,6,7,8,9],array[3,4,10],4.5,440,9.1,350,'Opera','LinkedIn','perdu','moyenne',3000,250,array['Appels manqués'],70,'Route des Cimes')
    ) as t(idx,nom,ville,cp,dep,etoiles,chambres,type_hotel,services,ouverture,haute,creux,ng,nbg,nb,nbb,pms,source,code,priorite,setup,mensuel,douleurs,age,adresse)
    order by idx
  loop
    select id into v_etape from public.etapes_pipeline where user_id = v_uid and code = r.code;
    v_slug := replace(public.normaliser(r.nom), 'hotel', 'hotel-');

    insert into public.hotels (user_id, nom, adresse, code_postal, ville, departement, site_web, url_booking, url_google_maps,
      etoiles, nb_chambres, type_hotel, services, ouverture, mois_haute_saison, mois_creux,
      note_google, nb_avis_google, note_booking, nb_avis_booking, pms, channel_manager, moteur_reservation, crm,
      source, etape_id, priorite, montant_setup_estime, montant_mensuel_estime, probabilite, douleurs,
      raison_perte, detail_perte, date_recontact, created_at, date_entree_etape)
    values (v_uid, r.nom, r.adresse, r.cp, r.ville, r.dep,
      'https://www.' || v_slug || '.exemple.fr',
      'https://www.booking.com/searchresults.fr.html?ss=' || replace(r.nom, ' ', '+'),
      'https://www.google.com/maps/search/' || replace(r.nom || ' ' || r.ville, ' ', '+'),
      r.etoiles, r.chambres, r.type_hotel, r.services, r.ouverture, r.haute::smallint[], r.creux::smallint[],
      r.ng, r.nbg, r.nb, r.nbb, r.pms,
      case when r.idx % 3 = 0 then 'SiteMinder' when r.idx % 3 = 1 then 'D-Edge' else null end,
      case when r.idx % 2 = 0 then 'D-Edge' else 'Moteur du PMS' end,
      null,
      r.source, v_etape, r.priorite, r.setup, r.mensuel,
      (select probabilite_defaut from public.etapes_pipeline where id = v_etape), r.douleurs,
      case r.idx when 19 then 'prix' when 20 then 'saison' end,
      case r.idx when 19 then 'Budget jugé trop élevé pour 18 chambres. Revoir avec une offre « avis » seule.'
                 when 20 then 'En pleine saison, le directeur n''a pas le temps. Recontacter en période creuse.' end,
      case r.idx when 19 then (current_date + 150) when 20 then (current_date + 20) end,
      now() - make_interval(days => r.age), now() - make_interval(days => greatest(r.age / 3, 1)))
    returning id into v_id;

    v_ids := v_ids || jsonb_build_object(r.idx::text, v_id);
  end loop;

  -- ---------------------------------------------------------- contacts
  insert into public.contacts (user_id, hotel_id, prenom, nom, poste, role_decision, email, telephone, linkedin, est_principal)
  select v_uid, (v_ids->>c.idx::text)::uuid, c.prenom, c.nom, c.poste, c.role,
         lower(left(c.prenom, 1) || '.' || replace(c.nom, ' ', '')) || '@hotel-demo-' || c.idx || '.exemple.fr',
         '04 9' || (c.idx % 5) || ' 00 ' || lpad((10 + c.idx)::text, 2, '0') || ' ' || lpad((c.rang * 11)::text, 2, '0'),
         'https://www.linkedin.com/in/' || lower(c.prenom || '-' || replace(c.nom, ' ', '')) || '-demo',
         c.rang = 1
  from (values
    ( 1,1,'Claire','Martin','directeur','decideur'),
    ( 2,1,'Olivier','Bastien','proprietaire','decideur'),
    ( 2,2,'Inès','Moreau','reception','utilisateur'),
    ( 3,1,'Patrick','Giraud','proprietaire','decideur'),
    ( 4,1,'Sophie','Lambert','directeur','decideur'),
    ( 5,1,'Marc','Rossi','directeur','decideur'),
    ( 5,2,'Julie','Fabre','marketing','influenceur'),
    ( 6,1,'Hélène','Roux','proprietaire','decideur'),
    ( 7,1,'Thomas','Garnier','directeur','decideur'),
    ( 7,2,'Camille','Lefèvre','revenue_manager','influenceur'),
    ( 8,1,'Nicolas','Barbier','directeur','decideur'),
    ( 9,1,'Isabelle','Mercier','proprietaire','decideur'),
    ( 9,2,'Lucas','Faure','reception','utilisateur'),
    (10,1,'Antoine','Blanc','directeur','decideur'),
    (11,1,'Valérie','Chevalier','directeur','decideur'),
    (11,2,'Romain','Perrin','revenue_manager','influenceur'),
    (12,1,'Alexandre','Morel','directeur','decideur'),
    (12,2,'Laura','Gauthier','marketing','influenceur'),
    (13,1,'Stéphane','Dupont','directeur','decideur'),
    (14,1,'Nathalie','Fournier','proprietaire','decideur'),
    (15,1,'François','Michel','directeur','decideur'),
    (15,2,'Émilie','Robin','revenue_manager','influenceur'),
    (15,3,'Kevin','Henry','reception','utilisateur'),
    (16,1,'Sandrine','Bonnet','proprietaire','decideur'),
    (17,1,'Philippe','Arnaud','directeur','decideur'),
    (18,1,'Aurélie','Vidal','directeur','decideur'),
    (18,2,'Mathieu','Caron','reception','utilisateur'),
    (19,1,'Gérard','Leroy','proprietaire','decideur'),
    (20,1,'Caroline','Marchand','directeur','decideur')
  ) as c(idx, rang, prenom, nom, poste, role);

  -- ---------------------------------------------------------- relances / RDV
  -- Les hôtels « Contacté » ont déjà leur séquence J+3/7/14 (trigger).
  -- On en met une en retard pour la démo.
  update public.relances set date_prevue = public.paris_jour(-2)
   where hotel_id = (v_ids->>'5')::uuid and sequence_jour = 3;
  update public.relances set date_prevue = public.paris_jour(0, 10)
   where hotel_id = (v_ids->>'7')::uuid and sequence_jour = 3;

  insert into public.relances (user_id, hotel_id, type, titre, date_prevue, duree_min, lieu_ou_lien, statut, fait_le) values
    (v_uid, (v_ids->>'1')::uuid,  'linkedin', 'Envoyer l''invitation LinkedIn', public.paris_jour(0, 9), null, null, 'a_faire', null),
    (v_uid, (v_ids->>'2')::uuid,  'email',    'Email à froid personnalisé', public.paris_jour(1, 9), null, null, 'a_faire', null),
    (v_uid, (v_ids->>'9')::uuid,  'rdv',      'Découverte — Villa Mimosa', public.paris_jour(1, 10), 45, 'Sur place, Antibes', 'a_faire', null),
    (v_uid, (v_ids->>'10')::uuid, 'rdv',      'Visio découverte — Le Cap Bleu', public.paris_jour(2, 14), 30, 'https://meet.google.com/demo-cap-bleu', 'a_faire', null),
    (v_uid, (v_ids->>'11')::uuid, 'email',    'Envoyer la proposition suite à l''audit', public.paris_jour(0, 11), null, null, 'a_faire', null),
    (v_uid, (v_ids->>'12')::uuid, 'appel',    'Débrief audit avec le directeur', public.paris_jour(-2, 15), null, null, 'a_faire', null),
    (v_uid, (v_ids->>'13')::uuid, 'appel',    'Relancer la proposition', public.paris_jour(-1, 10), null, null, 'a_faire', null),
    (v_uid, (v_ids->>'14')::uuid, 'email',    'Relance proposition', public.paris_jour(3, 9), null, null, 'a_faire', null),
    (v_uid, (v_ids->>'15')::uuid, 'rdv',      'Négociation finale — Grand Hôtel de la Rade', public.paris_jour(4, 15), 60, 'Sur place, Toulon', 'a_faire', null),
    (v_uid, (v_ids->>'20')::uuid, 'appel',    'Recontacter (période creuse)', public.paris_jour(20, 10), null, null, 'a_faire', null),
    -- RDV passés (historique du graphique mensuel)
    (v_uid, (v_ids->>'16')::uuid, 'rdv', 'Découverte', now() - interval '160 days', 45, null, 'fait', now() - interval '160 days'),
    (v_uid, (v_ids->>'17')::uuid, 'rdv', 'Découverte', now() - interval '130 days', 45, null, 'fait', now() - interval '130 days'),
    (v_uid, (v_ids->>'18')::uuid, 'rdv', 'Découverte', now() - interval '110 days', 45, null, 'fait', now() - interval '110 days'),
    (v_uid, (v_ids->>'15')::uuid, 'rdv', 'Découverte', now() - interval '65 days', 60, null, 'fait', now() - interval '65 days'),
    (v_uid, (v_ids->>'19')::uuid, 'rdv', 'Découverte', now() - interval '80 days', 30, null, 'fait', now() - interval '80 days'),
    (v_uid, (v_ids->>'12')::uuid, 'rdv', 'Audit sur place', now() - interval '20 days', 90, null, 'fait', now() - interval '20 days'),
    (v_uid, (v_ids->>'11')::uuid, 'rdv', 'Audit sur place', now() - interval '12 days', 90, null, 'fait', now() - interval '12 days'),
    (v_uid, (v_ids->>'13')::uuid, 'rdv', 'Découverte', now() - interval '40 days', 45, null, 'fait', now() - interval '40 days'),
    (v_uid, (v_ids->>'14')::uuid, 'rdv', 'Découverte', now() - interval '33 days', 45, null, 'fait', now() - interval '33 days'),
    (v_uid, (v_ids->>'20')::uuid, 'rdv', 'Découverte', now() - interval '55 days', 30, null, 'fait', now() - interval '55 days');

  -- ---------------------------------------------------------- historique d'activité (4 semaines, jours ouvrés)
  for d in 1..28 loop
    if extract(isodow from current_date - d) < 6 then
      insert into public.activite_quotidienne (user_id, date, linkedin, appels, emails)
      values (v_uid, current_date - d, 10 + floor(random() * 15)::int, 2 + floor(random() * 5)::int, 4 + floor(random() * 9)::int);
    end if;
  end loop;
  insert into public.activite_quotidienne (user_id, date, linkedin, appels, emails)
  values (v_uid, (now() at time zone 'Europe/Paris')::date, 6, 1, 3)
  on conflict (user_id, date) do nothing;

  -- ---------------------------------------------------------- interactions (timeline)
  insert into public.interactions (user_id, hotel_id, type, contenu, date) values
    (v_uid, (v_ids->>'5')::uuid,  'linkedin', 'Invitation acceptée, premier message envoyé.', now() - interval '6 days'),
    (v_uid, (v_ids->>'7')::uuid,  'email',    'Email à froid envoyé à Thomas Garnier.', now() - interval '3 days'),
    (v_uid, (v_ids->>'9')::uuid,  'appel',    'Isabelle intéressée par les avis et l''upsell. RDV calé sur place.', now() - interval '5 days'),
    (v_uid, (v_ids->>'11')::uuid, 'note',     'Audit : ~40 demandes séminaires/mois traitées à la main, 3 logiciels non connectés, beaucoup d''appels perdus le soir.', now() - interval '12 days'),
    (v_uid, (v_ids->>'12')::uuid, 'note',     'Audit : clientèle internationale, gros potentiel upsell (transferts, spa). Décision après la saison.', now() - interval '20 days'),
    (v_uid, (v_ids->>'13')::uuid, 'email',    'Proposition envoyée (standard IA + avis).', now() - interval '9 days'),
    (v_uid, (v_ids->>'15')::uuid, 'appel',    'Le DG veut une remise sur la mise en place. Accord possible à -10 %.', now() - interval '4 days'),
    (v_uid, (v_ids->>'16')::uuid, 'note',     'Très satisfaite du standard IA. Ouverte à parler des emails pré-séjour.', now() - interval '15 days'),
    (v_uid, (v_ids->>'19')::uuid, 'appel',    'Trop cher pour eux en ce moment.', now() - interval '30 days'),
    (v_uid, (v_ids->>'20')::uuid, 'appel',    'Pas le temps en saison, rappeler fin octobre / novembre.', now() - interval '25 days');

  -- ---------------------------------------------------------- propositions
  insert into public.propositions (user_id, hotel_id, titre, statut, date_envoi, date_validite, introduction, remise_pct, created_at)
  values (v_uid, (v_ids->>'13')::uuid, 'Automatisation de l''accueil téléphonique et des avis', 'envoyee',
          current_date - 9, current_date + 21,
          'Suite à notre échange, voici la proposition pour supprimer les appels manqués et répondre à 100 % des avis.', 0, now() - interval '9 days')
  returning id into v_prop;
  insert into public.lignes_proposition (user_id, proposition_id, offre_id, libelle, description, prix_setup, prix_mensuel, ordre)
  select v_uid, v_prop, o.id, o.nom, o.description, o.prix_setup_indicatif, o.prix_mensuel_indicatif, o.ordre
    from public.offres o where o.user_id = v_uid and o.ordre in (1, 2);

  insert into public.propositions (user_id, hotel_id, titre, statut, date_envoi, date_validite, introduction, remise_pct, created_at)
  values (v_uid, (v_ids->>'14')::uuid, 'Upsell et parcours client automatisé', 'envoyee',
          current_date - 5, current_date + 25,
          'Proposition pour générer du revenu additionnel avant l''arrivée et collecter davantage d''avis.', 0, now() - interval '5 days')
  returning id into v_prop;
  insert into public.lignes_proposition (user_id, proposition_id, offre_id, libelle, description, prix_setup, prix_mensuel, ordre)
  select v_uid, v_prop, o.id, o.nom, o.description, o.prix_setup_indicatif, o.prix_mensuel_indicatif, o.ordre
    from public.offres o where o.user_id = v_uid and o.ordre in (3, 6);

  insert into public.propositions (user_id, hotel_id, titre, statut, date_envoi, date_validite, introduction, remise_pct, created_at)
  values (v_uid, (v_ids->>'15')::uuid, 'Programme d''automatisation — Grand Hôtel de la Rade', 'envoyee',
          current_date - 14, current_date + 16,
          'Programme complet : accueil téléphonique, demandes séminaires et synchronisation des outils.', 10, now() - interval '14 days')
  returning id into v_prop;
  insert into public.lignes_proposition (user_id, proposition_id, offre_id, libelle, description, prix_setup, prix_mensuel, ordre)
  select v_uid, v_prop, o.id, o.nom, o.description, o.prix_setup_indicatif, o.prix_mensuel_indicatif, o.ordre
    from public.offres o where o.user_id = v_uid and o.ordre in (1, 5, 7);

  insert into public.propositions (user_id, hotel_id, titre, statut, date_envoi, introduction)
  values (v_uid, (v_ids->>'11')::uuid, 'Demandes séminaires et accueil téléphonique', 'brouillon', null,
          'Brouillon préparé après l''audit.');

  -- ---------------------------------------------------------- clients (fiches créées par le trigger « Gagné »)
  -- Client 1 : Le Jardin de la Darse — standard IA en production (upsell à proposer)
  insert into public.propositions (user_id, hotel_id, titre, statut, date_envoi, created_at)
  values (v_uid, (v_ids->>'16')::uuid, 'Standard téléphonique IA', 'acceptee', current_date - 145, now() - interval '145 days')
  returning id into v_prop;
  insert into public.lignes_proposition (user_id, proposition_id, offre_id, libelle, prix_setup, prix_mensuel)
  select v_uid, v_prop, o.id, o.nom, 2500, 290 from public.offres o where o.user_id = v_uid and o.ordre = 1;
  update public.clients set date_signature = current_date - 140, proposition_id = v_prop,
         date_renouvellement = current_date + 225, notes = 'Cliente très satisfaite. Bonne candidate pour un témoignage.'
   where hotel_id = (v_ids->>'16')::uuid returning id into v_client;
  insert into public.client_automatisations (user_id, client_id, offre_id, nom, statut, date_livraison, date_mise_en_service, prix_setup, prix_mensuel)
  select v_uid, v_client, o.id, o.nom, 'en_production', current_date - 112, current_date - 110, 2500, 290
    from public.offres o where o.user_id = v_uid and o.ordre = 1;

  -- Client 2 : Les Voiles Blanches — avis + emails pré/post séjour
  insert into public.propositions (user_id, hotel_id, titre, statut, date_envoi, created_at)
  values (v_uid, (v_ids->>'17')::uuid, 'Avis et parcours client', 'acceptee', current_date - 105, now() - interval '105 days')
  returning id into v_prop;
  insert into public.lignes_proposition (user_id, proposition_id, offre_id, libelle, prix_setup, prix_mensuel)
  select v_uid, v_prop, o.id, o.nom, o.prix_setup_indicatif, o.prix_mensuel_indicatif from public.offres o where o.user_id = v_uid and o.ordre in (2, 3);
  update public.clients set date_signature = current_date - 100, proposition_id = v_prop, date_renouvellement = current_date + 265
   where hotel_id = (v_ids->>'17')::uuid returning id into v_client;
  insert into public.client_automatisations (user_id, client_id, offre_id, nom, statut, date_livraison, date_mise_en_service, prix_setup, prix_mensuel)
  select v_uid, v_client, o.id, o.nom, 'en_production', current_date - (case o.ordre when 2 then 82 else 72 end),
         current_date - (case o.ordre when 2 then 80 else 70 end), o.prix_setup_indicatif, o.prix_mensuel_indicatif
    from public.offres o where o.user_id = v_uid and o.ordre in (2, 3);

  -- Client 3 : Les Suites du Cros — reporting en production, synchro PMS en cours
  insert into public.propositions (user_id, hotel_id, titre, statut, date_envoi, created_at)
  values (v_uid, (v_ids->>'18')::uuid, 'Synchronisation PMS et reporting', 'acceptee', current_date - 45, now() - interval '45 days')
  returning id into v_prop;
  insert into public.lignes_proposition (user_id, proposition_id, offre_id, libelle, prix_setup, prix_mensuel)
  select v_uid, v_prop, o.id, o.nom, o.prix_setup_indicatif, o.prix_mensuel_indicatif from public.offres o where o.user_id = v_uid and o.ordre in (6, 7);
  update public.clients set date_signature = current_date - 40, proposition_id = v_prop, date_renouvellement = current_date + 325,
         notes = 'Mise en service de la synchro Mews prévue fin du mois.'
   where hotel_id = (v_ids->>'18')::uuid returning id into v_client;
  insert into public.client_automatisations (user_id, client_id, offre_id, nom, statut, date_livraison, date_mise_en_service, prix_setup, prix_mensuel)
  select v_uid, v_client, o.id, o.nom,
         case o.ordre when 6 then 'en_production' else 'en_cours' end,
         case o.ordre when 6 then current_date - 12 end,
         case o.ordre when 6 then current_date - 10 end,
         o.prix_setup_indicatif, o.prix_mensuel_indicatif
    from public.offres o where o.user_id = v_uid and o.ordre in (6, 7);

  -- Une signature ce mois-ci pour la démo du dashboard : mise à jour de la date du client 3
  update public.clients set date_signature = date_trunc('month', current_date)::date + 1
   where hotel_id = (v_ids->>'18')::uuid and extract(day from current_date) > 1;
end $$;

revoke execute on function public.charger_donnees_demo() from public, anon;
grant execute on function public.charger_donnees_demo() to authenticated;
