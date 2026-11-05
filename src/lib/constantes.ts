import type {
  CanalModele,
  MetriqueObjectif,
  Poste,
  Priorite,
  RaisonPerte,
  RoleDecision,
  StatutAutomatisation,
  StatutClient,
  StatutProposition,
  TypeHotel,
  TypeInteraction,
  TypeRelance,
} from "./types";

export const TYPES_HOTEL: Record<TypeHotel, string> = {
  independant: "Indépendant",
  groupe: "Groupe",
  franchise: "Chaîne franchisée",
  residence: "Résidence de tourisme",
  camping_premium: "Camping haut de gamme",
};

export const PRIORITES: Record<Priorite, string> = { haute: "Haute", moyenne: "Moyenne", basse: "Basse" };

export const RAISONS_PERTE: Record<RaisonPerte, string> = {
  prix: "Prix",
  timing: "Timing",
  saison: "Saison en cours",
  pas_interesse: "Pas intéressé",
  concurrent: "Concurrent",
  autre: "Autre",
};

export const POSTES: Record<Poste, string> = {
  directeur: "Directeur",
  proprietaire: "Propriétaire",
  reception: "Réception",
  revenue_manager: "Revenue manager",
  marketing: "Marketing",
  autre: "Autre",
};

export const ROLES_DECISION: Record<RoleDecision, string> = {
  decideur: "Décideur",
  influenceur: "Influenceur",
  utilisateur: "Utilisateur",
};

export const TYPES_INTERACTION: Record<TypeInteraction, string> = {
  note: "Note",
  appel: "Appel",
  email: "Email",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  rdv: "Rendez-vous",
  changement_etape: "Changement d'étape",
};

export const TYPES_RELANCE: Record<TypeRelance, string> = {
  appel: "Appel",
  email: "Email",
  linkedin: "LinkedIn",
  rdv: "Rendez-vous",
  autre: "Autre",
};

export const STATUTS_PROPOSITION: Record<StatutProposition, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  acceptee: "Acceptée",
  refusee: "Refusée",
};

export const STATUTS_CLIENT: Record<StatutClient, string> = { actif: "Actif", pause: "En pause", resilie: "Résilié" };

export const STATUTS_AUTOMATISATION: Record<StatutAutomatisation, string> = {
  en_cours: "En cours",
  en_production: "En production",
  arretee: "Arrêtée",
};

export const CANAUX_MODELE: Record<CanalModele, string> = {
  linkedin_invitation: "LinkedIn — invitation",
  linkedin_message: "LinkedIn — premier message",
  linkedin_relance: "LinkedIn — relance",
  email_froid: "Email à froid",
  email_relance: "Email de relance",
  script_appel: "Script d'appel",
};

export const METRIQUES: Record<MetriqueObjectif, string> = {
  linkedin: "Messages LinkedIn",
  appels: "Appels",
  emails: "Emails",
  rdv: "RDV obtenus",
  signatures: "Signatures",
  ca: "CA signé",
};

export const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
export const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Classes Tailwind par couleur d'étape (liste fermée pour que Tailwind les génère). */
export const COULEURS_ETAPE: Record<string, { pastille: string; badge: string }> = {
  slate: { pastille: "bg-slate-400", badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20" },
  blue: { pastille: "bg-blue-500", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  violet: { pastille: "bg-violet-500", badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20" },
  amber: { pastille: "bg-amber-500", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
  orange: { pastille: "bg-orange-500", badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20" },
  pink: { pastille: "bg-pink-500", badge: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20" },
  emerald: { pastille: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
  red: { pastille: "bg-red-500", badge: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20" },
  cyan: { pastille: "bg-cyan-500", badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20" },
};
export const couleurEtape = (c: string | null | undefined) => COULEURS_ETAPE[c ?? "slate"] ?? COULEURS_ETAPE.slate;
