import type { Etape } from "./types";

/** Étape suivante dans le flux commercial (on ne « passe » jamais automatiquement à Perdu). */
export function etapeSuivante(etapes: Etape[], etapeId: string | null): Etape | null {
  const triees = [...etapes].sort((a, b) => a.ordre - b.ordre);
  const actuelle = triees.find((e) => e.id === etapeId);
  if (!actuelle || actuelle.code === "gagne" || actuelle.code === "perdu") return null;
  return triees.find((e) => e.ordre > actuelle.ordre && e.code !== "perdu") ?? null;
}

/** Valeur annuelle d'un deal : mise en place + 12 mois de maintenance. */
export const valeurAnnuelle = (setup: number, mensuel: number) => Number(setup || 0) + 12 * Number(mensuel || 0);

/** Valeur pondérée par la probabilité. */
export const valeurPonderee = (setup: number, mensuel: number, probabilite: number) =>
  Math.round(valeurAnnuelle(setup, mensuel) * (Number(probabilite || 0) / 100) * 100) / 100;

/** Vrai si l'un des mois (1-12) est le mois courant ou le suivant. */
export function aContacterMaintenant(moisCreux: number[] | null | undefined, maintenant = new Date()) {
  if (!moisCreux?.length) return false;
  const m = maintenant.getMonth() + 1;
  const suivant = (m % 12) + 1;
  return moisCreux.includes(m) || moisCreux.includes(suivant);
}
