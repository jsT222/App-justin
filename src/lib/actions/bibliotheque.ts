"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/server";
import type { ModeleMessage, Offre } from "@/lib/types";

type R = { ok: true } | { ok: false; erreur: string };
const CHAMPS_OFFRE = ["nom", "categorie", "description", "prix_setup_indicatif", "prix_mensuel_indicatif", "gain_estime", "duree_mise_en_place", "douleurs_associees", "actif", "ordre"];
const CHAMPS_MODELE = ["canal", "titre", "objet", "contenu", "ordre"];
const filtrer = (o: object, champs: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => champs.includes(k)));

export async function enregistrerOffre(o: Partial<Offre>, id?: string): Promise<R> {
  if (!o.nom?.trim()) return { ok: false, erreur: "Le nom est obligatoire." };
  const { supabase } = await getSession();
  const d = filtrer(o, CHAMPS_OFFRE);
  const { error } = id ? await supabase.from("offres").update(d).eq("id", id) : await supabase.from("offres").insert(d);
  if (error) return { ok: false, erreur: error.message };
  revalidatePath("/bibliotheque");
  return { ok: true };
}

export async function supprimerOffre(id: string): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("offres").delete().eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  revalidatePath("/bibliotheque");
  return { ok: true };
}

export async function enregistrerModele(m: Partial<ModeleMessage>, id?: string): Promise<R> {
  if (!m.titre?.trim() || !m.contenu?.trim()) return { ok: false, erreur: "Titre et contenu obligatoires." };
  const { supabase } = await getSession();
  const d = filtrer(m, CHAMPS_MODELE);
  const { error } = id ? await supabase.from("modeles_messages").update(d).eq("id", id) : await supabase.from("modeles_messages").insert(d);
  if (error) return { ok: false, erreur: error.message };
  revalidatePath("/bibliotheque");
  return { ok: true };
}

export async function supprimerModele(id: string): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("modeles_messages").delete().eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  revalidatePath("/bibliotheque");
  return { ok: true };
}
