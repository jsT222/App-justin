export interface LigneCalc { quantite: number; prix_setup: number; prix_mensuel: number }

export function totauxProposition(lignes: LigneCalc[], remisePct: number) {
  const setupBrut = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_setup) || 0), 0);
  const remise = Math.round(setupBrut * (Math.min(Math.max(Number(remisePct) || 0, 0), 100) / 100) * 100) / 100;
  const mensuel = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_mensuel) || 0), 0);
  return { setupBrut, remise, setup: Math.round((setupBrut - remise) * 100) / 100, mensuel, premiereAnnee: setupBrut - remise + 12 * mensuel };
}
