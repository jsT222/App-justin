// Types de domaine, alignés sur supabase/migrations/*.sql

export type CodeEtape = "nouveau" | "contacte" | "rdv" | "audit" | "proposition" | "negociation" | "gagne" | "perdu";
export type TypeHotel = "independant" | "groupe" | "franchise" | "residence" | "camping_premium";
export type Priorite = "haute" | "moyenne" | "basse";
export type RaisonPerte = "prix" | "timing" | "saison" | "pas_interesse" | "concurrent" | "autre";
export type Poste = "directeur" | "proprietaire" | "reception" | "revenue_manager" | "marketing" | "autre";
export type RoleDecision = "decideur" | "influenceur" | "utilisateur";
export type TypeInteraction = "note" | "appel" | "email" | "linkedin" | "whatsapp" | "rdv" | "changement_etape";
export type TypeRelance = "appel" | "email" | "linkedin" | "rdv" | "autre";
export type StatutRelance = "a_faire" | "fait" | "annule";
export type StatutProposition = "brouillon" | "envoyee" | "acceptee" | "refusee";
export type StatutClient = "actif" | "pause" | "resilie";
export type StatutAutomatisation = "en_cours" | "en_production" | "arretee";
export type CanalModele =
  | "linkedin_invitation"
  | "linkedin_message"
  | "linkedin_relance"
  | "email_froid"
  | "email_relance"
  | "script_appel";
export type MetriqueObjectif = "linkedin" | "appels" | "emails" | "rdv" | "signatures" | "ca";
export type CategorieListe = "source" | "douleur" | "service" | "pms";

export interface Etape {
  id: string;
  nom: string;
  code: CodeEtape | null;
  ordre: number;
  couleur: string;
  probabilite_defaut: number;
}

export interface Hotel {
  id: string;
  user_id: string;
  nom: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  departement: string | null;
  site_web: string | null;
  url_booking: string | null;
  url_google_maps: string | null;
  etoiles: number | null;
  nb_chambres: number | null;
  type_hotel: TypeHotel | null;
  services: string[];
  ouverture: "annuelle" | "saisonniere";
  mois_haute_saison: number[];
  mois_creux: number[];
  note_google: number | null;
  nb_avis_google: number | null;
  note_booking: number | null;
  nb_avis_booking: number | null;
  pms: string | null;
  channel_manager: string | null;
  moteur_reservation: string | null;
  crm: string | null;
  source: string | null;
  etape_id: string | null;
  date_entree_etape: string;
  priorite: Priorite;
  montant_setup_estime: number;
  montant_mensuel_estime: number;
  probabilite: number;
  douleurs: string[];
  raison_perte: RaisonPerte | null;
  detail_perte: string | null;
  date_recontact: string | null;
  cle_doublon: string;
  created_at: string;
  updated_at: string;
}

/** Ligne de la vue v_hotels */
export interface HotelVue extends Hotel {
  etape_nom: string | null;
  etape_code: CodeEtape | null;
  etape_ordre: number | null;
  etape_couleur: string | null;
  contact_id: string | null;
  contact_nom: string | null;
  contact_email: string | null;
  contact_telephone: string | null;
  contact_linkedin: string | null;
  prochaine_action_id: string | null;
  prochaine_action_type: TypeRelance | null;
  prochaine_action_titre: string | null;
  prochaine_action_date: string | null;
  client_id: string | null;
  valeur_annuelle: number;
  valeur_ponderee: number;
}

export interface Contact {
  id: string;
  hotel_id: string;
  prenom: string | null;
  nom: string | null;
  poste: Poste | null;
  role_decision: RoleDecision | null;
  email: string | null;
  telephone: string | null;
  linkedin: string | null;
  est_principal: boolean;
  notes: string | null;
  created_at: string;
}

export interface Interaction {
  id: string;
  hotel_id: string;
  contact_id: string | null;
  type: TypeInteraction;
  contenu: string;
  date: string;
  created_at: string;
}

export interface Relance {
  id: string;
  hotel_id: string;
  contact_id: string | null;
  type: TypeRelance;
  titre: string;
  date_prevue: string;
  duree_min: number | null;
  lieu_ou_lien: string | null;
  statut: StatutRelance;
  fait_le: string | null;
  sequence_jour: number | null;
  created_at: string;
}

export interface RelanceAvecHotel extends Relance {
  hotels: Pick<Hotel, "id" | "nom" | "ville"> | null;
}

export interface Offre {
  id: string;
  nom: string;
  categorie: string | null;
  description: string | null;
  prix_setup_indicatif: number;
  prix_mensuel_indicatif: number;
  gain_estime: string | null;
  duree_mise_en_place: string | null;
  douleurs_associees: string[];
  actif: boolean;
  ordre: number;
}

export interface ModeleMessage {
  id: string;
  canal: CanalModele;
  titre: string;
  objet: string | null;
  contenu: string;
  ordre: number;
}

export interface Proposition {
  id: string;
  hotel_id: string;
  numero: string | null;
  titre: string;
  statut: StatutProposition;
  date_envoi: string | null;
  date_validite: string | null;
  introduction: string | null;
  conditions: string | null;
  remise_pct: number;
  total_setup: number;
  total_mensuel: number;
  created_at: string;
  updated_at: string;
}

export interface LigneProposition {
  id: string;
  proposition_id: string;
  offre_id: string | null;
  libelle: string;
  description: string | null;
  quantite: number;
  prix_setup: number;
  prix_mensuel: number;
  ordre: number;
}

export interface Client {
  id: string;
  hotel_id: string;
  proposition_id: string | null;
  date_signature: string;
  statut: StatutClient;
  date_renouvellement: string | null;
  notes: string | null;
}

/** Ligne de la vue v_clients */
export interface ClientVue extends Client {
  hotel_nom: string;
  ville: string | null;
  etoiles: number | null;
  nb_chambres: number | null;
  site_web: string | null;
  mrr: number;
  total_setup: number;
  nb_automatisations: number;
  premiere_mise_en_service: string | null;
  prochain_upsell: string | null;
}

export interface ClientAutomatisation {
  id: string;
  client_id: string;
  offre_id: string | null;
  nom: string;
  statut: StatutAutomatisation;
  date_livraison: string | null;
  date_mise_en_service: string | null;
  prix_setup: number;
  prix_mensuel: number;
  date_rappel_upsell: string | null;
  upsell_traite: boolean;
}

export interface Objectif {
  id: string;
  periode: "quotidien" | "mensuel";
  metrique: MetriqueObjectif;
  valeur_cible: number;
  mois: string | null;
}

export interface ActiviteQuotidienne {
  id: string;
  date: string;
  linkedin: number;
  appels: number;
  emails: number;
}

export interface Profil {
  user_id: string;
  nom_complet: string | null;
  raison_sociale: string | null;
  siret: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  site_web: string | null;
  logo_url: string | null;
  mention_tva: string | null;
  iban: string | null;
  conditions_paiement: string | null;
  validite_devis_jours: number | null;
}

export interface ListeValeur {
  id: string;
  categorie: CategorieListe;
  valeur: string;
  ordre: number;
}
