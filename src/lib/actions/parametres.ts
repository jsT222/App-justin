"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/server";
import type { CategorieListe, Etape, Profil } from "@/lib/types";

type R = { ok: true } | { ok: false; erreur: string };
const tout = () => revalidatePath("/", "layout");

const CHAMPS_PROFIL = ["nom_complet", "raison_sociale", "siret", "adresse", "email", "telephone", "site_web", "logo_url", "mention_tva", "iban", "conditions_paiement", "validite_devis_jours"];

export async function majProfil(p: Partial<Profil>): Promise<R> {
  const { supabase, user } = await getSession();
  const d = Object.fromEntries(Object.entries(p).filter(([k]) => CHAMPS_PROFIL.includes(k)).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]));
  const { error } = await supabase.from("profils").upsert({ ...d, user_id: user.id });
  if (error) return { ok: false, erreur: error.message };
  tout();
  return { ok: true };
}

export async function televerserLogo(formData: FormData): Promise<R & { url?: string }> {
  const fichier = formData.get("logo");
  if (!(fichier instanceof File) || !fichier.size) return { ok: false, erreur: "Aucun fichier." };
  if (fichier.size > 2 * 1024 * 1024) return { ok: false, erreur: "2 Mo maximum." };
  const { supabase, user } = await getSession();
  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "png";
  const chemin = `${user.id}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("logos").upload(chemin, fichier, { contentType: fichier.type, upsert: true });
  if (error) return { ok: false, erreur: error.message };
  const url = supabase.storage.from("logos").getPublicUrl(chemin).data.publicUrl;
  const r = await majProfil({ logo_url: url });
  return r.ok ? { ok: true, url } : r;
}

export async function enregistrerEtapes(etapes: (Pick<Etape, "nom" | "couleur" | "probabilite_defaut" | "ordre"> & { id?: string })[]): Promise<R> {
  const { supabase } = await getSession();
  for (const e of etapes) {
    const d = { nom: e.nom.trim() || "Étape", couleur: e.couleur, probabilite_defaut: Math.min(100, Math.max(0, Number(e.probabilite_defaut) || 0)), ordre: e.ordre };
    const { error } = e.id ? await supabase.from("etapes_pipeline").update(d).eq("id", e.id) : await supabase.from("etapes_pipeline").insert(d);
    if (error) return { ok: false, erreur: error.message };
  }
  tout();
  return { ok: true };
}

export async function supprimerEtape(id: string): Promise<R> {
  const { supabase } = await getSession();
  const { data: e } = await supabase.from("etapes_pipeline").select("code").eq("id", id).single();
  if (e?.code) return { ok: false, erreur: "Les étapes de base ne peuvent pas être supprimées (tu peux les renommer)." };
  const { count } = await supabase.from("hotels").select("id", { count: "exact", head: true }).eq("etape_id", id);
  if (count) return { ok: false, erreur: `${count} hôtel(s) sont dans cette étape : déplace-les d'abord.` };
  const { error } = await supabase.from("etapes_pipeline").delete().eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  tout();
  return { ok: true };
}

export async function ajouterValeur(categorie: CategorieListe, valeur: string): Promise<R> {
  if (!valeur.trim()) return { ok: false, erreur: "Valeur vide." };
  const { supabase } = await getSession();
  const { count } = await supabase.from("listes_valeurs").select("id", { count: "exact", head: true }).eq("categorie", categorie);
  const { error } = await supabase.from("listes_valeurs").insert({ categorie, valeur: valeur.trim(), ordre: (count ?? 0) + 1 });
  if (error) return { ok: false, erreur: error.code === "23505" ? "Cette valeur existe déjà." : error.message };
  tout();
  return { ok: true };
}

export async function supprimerValeur(id: string): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("listes_valeurs").delete().eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  tout();
  return { ok: true };
}

export async function chargerDemo(): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("charger_donnees_demo");
  if (error) return { ok: false, erreur: error.message };
  tout();
  return { ok: true };
}
