"use server";

import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { getSession } from "@/lib/supabase/server";
import { PARIS } from "@/lib/dates";
import type { LigneProposition, Proposition, StatutProposition } from "@/lib/types";

type R<T = undefined> = { ok: true; data?: T } | { ok: false; erreur: string };

function rafraichir(id?: string, hotelId?: string) {
  revalidatePath("/propositions");
  if (id) revalidatePath(`/propositions/${id}`);
  if (hotelId) revalidatePath(`/prospects/${hotelId}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
}

export async function creerProposition(hotelId: string, offreIds: string[], titre?: string): Promise<R<{ id: string }>> {
  const { supabase, user } = await getSession();
  const [{ data: profil }, { data: offres }] = await Promise.all([
    supabase.from("profils").select("conditions_paiement, validite_devis_jours").eq("user_id", user.id).maybeSingle(),
    offreIds.length ? supabase.from("offres").select("*").in("id", offreIds).order("ordre") : Promise.resolve({ data: [] as never[] }),
  ]);
  const { data: p, error } = await supabase
    .from("propositions")
    .insert({
      hotel_id: hotelId,
      titre: titre?.trim() || "Proposition d'automatisation",
      conditions: profil?.conditions_paiement ?? null,
      date_validite: format(addDays(new Date(), profil?.validite_devis_jours ?? 30), "yyyy-MM-dd", PARIS),
      introduction:
        "Suite à notre échange, voici ma proposition pour automatiser les tâches qui vous font perdre du temps et des réservations.",
    })
    .select("id")
    .single();
  if (error) return { ok: false, erreur: error.message };

  if (offres?.length) {
    const { error: e2 } = await supabase.from("lignes_proposition").insert(
      offres.map((o, i) => ({
        proposition_id: p.id,
        offre_id: o.id,
        libelle: o.nom,
        description: o.description,
        prix_setup: o.prix_setup_indicatif,
        prix_mensuel: o.prix_mensuel_indicatif,
        ordre: i,
      })),
    );
    if (e2) return { ok: false, erreur: e2.message };
  }
  rafraichir(p.id, hotelId);
  return { ok: true, data: { id: p.id } };
}

export type LigneSaisie = Pick<LigneProposition, "libelle" | "description" | "quantite" | "prix_setup" | "prix_mensuel" | "offre_id"> & { id?: string };

export async function enregistrerProposition(
  id: string,
  donnees: Pick<Proposition, "titre" | "introduction" | "conditions" | "remise_pct" | "date_envoi" | "date_validite">,
  lignes: LigneSaisie[],
): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase
    .from("propositions")
    .update({
      titre: donnees.titre?.trim() || "Proposition",
      introduction: donnees.introduction,
      conditions: donnees.conditions,
      remise_pct: Number(donnees.remise_pct) || 0,
      date_envoi: donnees.date_envoi || null,
      date_validite: donnees.date_validite || null,
    })
    .eq("id", id);
  if (error) return { ok: false, erreur: error.message };

  const { data: existantes } = await supabase.from("lignes_proposition").select("id").eq("proposition_id", id);
  const gardees = new Set(lignes.filter((l) => l.id).map((l) => l.id));
  const aSupprimer = (existantes ?? []).map((l) => l.id).filter((x) => !gardees.has(x));
  if (aSupprimer.length) await supabase.from("lignes_proposition").delete().in("id", aSupprimer);

  for (const [i, l] of lignes.entries()) {
    const d = {
      proposition_id: id,
      offre_id: l.offre_id ?? null,
      libelle: l.libelle.trim() || "Prestation",
      description: l.description?.trim() || null,
      quantite: Math.max(1, Number(l.quantite) || 1),
      prix_setup: Number(l.prix_setup) || 0,
      prix_mensuel: Number(l.prix_mensuel) || 0,
      ordre: i,
    };
    const { error: e } = l.id
      ? await supabase.from("lignes_proposition").update(d).eq("id", l.id)
      : await supabase.from("lignes_proposition").insert(d);
    if (e) return { ok: false, erreur: e.message };
  }
  rafraichir(id);
  return { ok: true };
}

export async function changerStatutProposition(id: string, statut: StatutProposition): Promise<R> {
  const { supabase } = await getSession();
  const maj: Partial<Proposition> = { statut };
  const { data: p } = await supabase.from("propositions").select("hotel_id, date_envoi, total_setup, total_mensuel").eq("id", id).single();
  if (!p) return { ok: false, erreur: "Proposition introuvable." };
  if (statut === "envoyee" && !p.date_envoi) maj.date_envoi = format(new Date(), "yyyy-MM-dd", PARIS);

  const { error } = await supabase.from("propositions").update(maj).eq("id", id);
  if (error) return { ok: false, erreur: error.message };

  // Envoyée : l'hôtel passe à « Proposition envoyée » s'il était avant dans le pipeline
  if (statut === "envoyee") {
    const [{ data: etapes }, { data: h }] = await Promise.all([
      supabase.from("etapes_pipeline").select("id, code, ordre"),
      supabase.from("hotels").select("etape_id").eq("id", p.hotel_id).single(),
    ]);
    const cible = etapes?.find((e) => e.code === "proposition");
    const actuelle = etapes?.find((e) => e.id === h?.etape_id);
    if (cible && (!actuelle || (actuelle.ordre < cible.ordre && actuelle.code !== "perdu"))) {
      await supabase.from("hotels").update({ etape_id: cible.id, montant_setup_estime: p.total_setup, montant_mensuel_estime: p.total_mensuel }).eq("id", p.hotel_id);
    }
    await supabase.from("interactions").insert({ hotel_id: p.hotel_id, type: "email", contenu: "Proposition envoyée" });
  }
  // Acceptée : le trigger SQL passe l'hôtel en « Gagné » et crée client + automatisations
  rafraichir(id, p.hotel_id);
  return { ok: true };
}

export async function supprimerProposition(id: string): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("propositions").delete().eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  rafraichir();
  return { ok: true };
}
