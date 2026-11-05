import "server-only";
import { getSession } from "@/lib/supabase/server";
import type { CategorieListe, Etape, HotelVue, ListeValeur, Offre } from "@/lib/types";

export async function getEtapes(): Promise<Etape[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("etapes_pipeline").select("id, nom, code, ordre, couleur, probabilite_defaut").order("ordre");
  return (data ?? []) as Etape[];
}

export type Listes = Record<CategorieListe, string[]>;

export async function getListes(): Promise<Listes> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("listes_valeurs").select("categorie, valeur, ordre").order("ordre");
  const listes: Listes = { source: [], douleur: [], service: [], pms: [] };
  for (const l of (data ?? []) as Pick<ListeValeur, "categorie" | "valeur">[]) listes[l.categorie]?.push(l.valeur);
  return listes;
}

export async function getHotelsVue(): Promise<HotelVue[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("v_hotels").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return normaliserNombres(data ?? []) as HotelVue[];
}

export async function getOffres(actives = true): Promise<Offre[]> {
  const { supabase } = await getSession();
  let q = supabase.from("offres").select("*").order("ordre");
  if (actives) q = q.eq("actif", true);
  const { data } = await q;
  return normaliserNombres(data ?? []) as Offre[];
}

/** PostgREST renvoie les numeric en chaîne : on les convertit. */
const CHAMPS_NUMERIQUES = new Set([
  "montant_setup_estime", "montant_mensuel_estime", "valeur_annuelle", "valeur_ponderee", "note_google", "note_booking",
  "prix_setup_indicatif", "prix_mensuel_indicatif", "prix_setup", "prix_mensuel", "total_setup", "total_mensuel",
  "remise_pct", "mrr", "valeur_cible", "nb_automatisations",
]);

export function normaliserNombres<T extends Record<string, unknown>>(lignes: T[]): T[] {
  return lignes.map((l) => {
    const r: Record<string, unknown> = { ...l };
    for (const k of Object.keys(r)) if (CHAMPS_NUMERIQUES.has(k) && r[k] != null) r[k] = Number(r[k]);
    return r as T;
  });
}
