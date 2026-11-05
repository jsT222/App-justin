-- =============================================================
-- Données par défaut créées à l'inscription
-- =============================================================

create or replace function public.initialiser_utilisateur(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (user_id, nom_complet, email)
  select p_user, coalesce(u.raw_user_meta_data->>'nom_complet', 'Justin'), u.email
    from auth.users u where u.id = p_user
  on conflict (user_id) do nothing;

  insert into public.etapes_pipeline (user_id, nom, code, ordre, couleur, probabilite_defaut) values
    (p_user, 'Nouveau',             'nouveau',     1, 'slate',   5),
    (p_user, 'Contacté',            'contacte',    2, 'blue',    10),
    (p_user, 'RDV planifié',        'rdv',         3, 'violet',  25),
    (p_user, 'Audit fait',          'audit',       4, 'amber',   40),
    (p_user, 'Proposition envoyée', 'proposition', 5, 'orange',  50),
    (p_user, 'Négociation',         'negociation', 6, 'pink',    70),
    (p_user, 'Gagné',               'gagne',       7, 'emerald', 100),
    (p_user, 'Perdu',               'perdu',       8, 'red',     0)
  on conflict (user_id, code) do nothing;

  insert into public.listes_valeurs (user_id, categorie, valeur, ordre)
  select p_user, v.categorie, v.valeur, v.ordre from (values
    ('source','LinkedIn',1),('source','Google Maps',2),('source','Recommandation',3),('source','Salon / événement',4),
    ('source','Email à froid',5),('source','Appel à froid',6),('source','Site web',7),('source','Réseau personnel',8),
    ('douleur','Appels manqués',1),('douleur','Avis sans réponse',2),('douleur','Emails répétitifs',3),
    ('douleur','Dépendance aux OTA',4),('douleur','Check-in manuel',5),('douleur','Upsell inexistant',6),
    ('douleur','Saisie entre logiciels',7),
    ('service','Restaurant',1),('service','Spa',2),('service','Séminaires',3),('service','Piscine',4),('service','Bar',5),
    ('service','Parking',6),('service','Salle de sport',7),('service','Plage privée',8),('service','Navette',9),
    ('service','Animaux acceptés',10),
    ('pms','Mews',1),('pms','Opera',2),('pms','Cloudbeds',3),('pms','Medialog',4),('pms','Misterbooking',5),('pms','Autre',6)
  ) as v(categorie, valeur, ordre)
  on conflict do nothing;

  if not exists (select 1 from public.offres where user_id = p_user) then
    insert into public.offres (user_id, nom, categorie, description, prix_setup_indicatif, prix_mensuel_indicatif, gain_estime, duree_mise_en_place, douleurs_associees, ordre) values
    (p_user, 'Standard téléphonique IA', 'Relation client',
     'Agent vocal IA qui décroche 24h/24 : réponses aux questions fréquentes (horaires, parking, animaux…), prise de demandes de réservation et transfert à la réception si besoin. Résumé de chaque appel envoyé par email.',
     2500, 290, 'Jusqu''à 30 % d''appels manqués récupérés, ~8 h/semaine libérées à la réception', '3 à 4 semaines',
     array['Appels manqués','Dépendance aux OTA'], 1),
    (p_user, 'Réponse automatique aux avis Google et Booking', 'E-réputation',
     'Rédaction par IA de réponses personnalisées aux avis, dans la langue du client, avec validation en un clic pour les avis négatifs.',
     900, 90, '100 % des avis traités en moins de 24 h, meilleure note de visibilité', '1 à 2 semaines',
     array['Avis sans réponse'], 2),
    (p_user, 'Emails pré-séjour et post-séjour automatisés', 'Revenus',
     'Séquence automatique : confirmation enrichie, offres d''upsell (surclassement, petit-déjeuner, spa) avant l''arrivée, puis demande d''avis et offre de retour en direct après le départ.',
     1500, 120, '+5 à 10 € de revenu additionnel par séjour, +40 % d''avis collectés', '2 à 3 semaines',
     array['Upsell inexistant','Emails répétitifs','Avis sans réponse','Dépendance aux OTA'], 3),
    (p_user, 'Chatbot réservation site et WhatsApp', 'Relation client',
     'Assistant conversationnel sur le site et WhatsApp qui répond aux questions, vérifie les disponibilités et oriente vers le moteur de réservation direct.',
     2000, 190, '+10 à 15 % de réservations directes, moins de commissions OTA', '3 semaines',
     array['Dépendance aux OTA','Appels manqués','Emails répétitifs'], 4),
    (p_user, 'Gestion des demandes séminaires et groupes', 'Commercial',
     'Qualification automatique des demandes (dates, participants, besoins), génération d''un devis préliminaire et relance des demandes sans réponse.',
     1800, 150, 'Devis envoyé en moins de 2 h au lieu de 2 jours, taux de transformation amélioré', '3 semaines',
     array['Emails répétitifs','Saisie entre logiciels'], 5),
    (p_user, 'Reporting automatique au directeur', 'Pilotage',
     'Rapport quotidien ou hebdomadaire envoyé par email : taux d''occupation, ADR, RevPAR, pick-up, avis récents et alertes.',
     1200, 90, '~3 h/semaine de reporting manuel supprimées', '2 semaines',
     array['Saisie entre logiciels'], 6),
    (p_user, 'Synchronisation PMS / outils internes', 'Opérations',
     'Connexion du PMS avec le CRM, la comptabilité, le check-in en ligne ou la messagerie pour supprimer les doubles saisies.',
     2500, 150, '5 à 10 h/semaine de saisie évitées, moins d''erreurs', '3 à 5 semaines',
     array['Saisie entre logiciels','Check-in manuel'], 7);
  end if;

  if not exists (select 1 from public.modeles_messages where user_id = p_user) then
    insert into public.modeles_messages (user_id, canal, titre, objet, contenu, ordre) values
    (p_user, 'linkedin_invitation', 'Invitation LinkedIn', null,
     'Bonjour {prenom}, j''accompagne les hôtels de la Côte d''Azur à automatiser les tâches répétitives (appels, avis, emails clients). J''aimerais échanger avec vous au sujet de {nom_hotel}. Au plaisir !', 1),
    (p_user, 'linkedin_message', 'Premier message LinkedIn', null,
     'Merci pour la connexion {prenom} !

Je travaille avec des hôtels {etoiles} étoiles autour de {ville} pour mettre en place des automatisations IA : standard téléphonique qui répond 24h/24, réponses aux avis Google et Booking, emails d''upsell avant l''arrivée…

Est-ce que la gestion des appels ou des avis est un sujet chez {nom_hotel} en ce moment ? Je peux vous montrer en 15 minutes ce que ça donnerait concrètement.', 2),
    (p_user, 'linkedin_relance', 'Relance LinkedIn', null,
     'Bonjour {prenom}, je me permets de revenir vers vous. Je viens de mettre en place un standard IA pour un hôtel de {nb_chambres} chambres comparable à {nom_hotel} : plus aucun appel perdu, même la nuit. Seriez-vous ouvert(e) à un court échange la semaine prochaine ?', 3),
    (p_user, 'email_froid', 'Email à froid', '{nom_hotel} — moins d''appels manqués, plus de réservations directes',
     'Bonjour {prenom},

En regardant {nom_hotel}, j''ai remarqué que plusieurs avis récents restaient sans réponse et que, comme beaucoup d''hôtels à {ville}, une partie des appels arrive hors des heures de réception.

J''aide les hôtels indépendants à automatiser ces tâches avec l''IA :
• un standard téléphonique qui répond 24h/24 et prend les demandes de réservation ;
• des réponses personnalisées aux avis Google et Booking ;
• des emails d''upsell envoyés automatiquement avant l''arrivée.

Résultat typique : plusieurs heures libérées chaque semaine pour l''équipe et davantage de réservations en direct.

Auriez-vous 20 minutes la semaine prochaine pour un audit gratuit de vos process ?

Bien à vous,
Justin', 4),
    (p_user, 'email_relance', 'Relance email', 'Re : {nom_hotel}',
     'Bonjour {prenom},

Je me permets de relancer mon précédent message. L''audit gratuit de 20 minutes tient toujours : je vous montre où {nom_hotel} perd du temps et des réservations, et ce qui peut être automatisé avant la prochaine saison.

Quel créneau vous conviendrait ?

Justin', 5),
    (p_user, 'script_appel', 'Script d''appel', null,
     'INTRODUCTION
« Bonjour, Justin à l''appareil. Je souhaiterais parler à {prenom}, s''il vous plaît. »
« {prenom}, je vous appelle car j''accompagne des hôtels autour de {ville} sur l''automatisation de leur relation client. Vous avez deux minutes ? »

QUESTIONS DE DÉCOUVERTE
1. Comment gérez-vous les appels en dehors des heures de réception ?
2. Qui répond aux avis Google et Booking aujourd''hui, et en combien de temps ?
3. Proposez-vous des services additionnels avant l''arrivée (surclassement, petit-déjeuner, spa) ?
4. Combien de temps l''équipe passe-t-elle à ressaisir des informations entre vos logiciels ({nom_hotel} utilise quel PMS ?)

PROPOSITION
« Ce que je propose, c''est un audit gratuit de 20 minutes pour identifier 2 ou 3 automatisations rentables dès cette saison. Plutôt mardi ou jeudi ? »

OBJECTIONS
• « Pas le temps » → « Justement, l''objectif est de vous en faire gagner. 20 minutes, je m''adapte à vos horaires. »
• « On a déjà un prestataire » → « Très bien, l''audit vous donnera un regard extérieur, sans engagement. »
• « C''est la saison » → « Je note de vous rappeler en période plus calme. Quel mois serait idéal ? »', 6);
  end if;

  insert into public.objectifs (user_id, periode, metrique, valeur_cible) values
    (p_user, 'quotidien', 'linkedin', 20),
    (p_user, 'quotidien', 'appels', 5),
    (p_user, 'quotidien', 'emails', 10),
    (p_user, 'mensuel', 'rdv', 8),
    (p_user, 'mensuel', 'signatures', 2),
    (p_user, 'mensuel', 'ca', 6000)
  on conflict do nothing;
end $$;

revoke execute on function public.initialiser_utilisateur(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.initialiser_utilisateur(new.id);
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
