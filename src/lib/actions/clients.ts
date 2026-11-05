"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/server";
import type { Client, ClientAutomatisation } from "@/lib/types";

type R = { ok: true } | { ok: false; erreur: string };
const rafraichir = (id?: string) => {
  revalidatePath("/clients");
  if (id) revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
};

export async function majClient(id: string, d: Partial<Pick<Client, "statut" | "date_signature" | "date_renouvellement" | "notes">>): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("clients").update(d).eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  rafraichir(id);
  return { ok: true };
}

const CHAMPS = ["nom", "offre_id", "statut", "date_livraison", "date_mise_en_service", "prix_setup", "prix_mensuel", "upsell_traite"];

export async function enregistrerAutomatisation(clientId: string, a: Partial<ClientAutomatisation>, id?: string): Promise<R> {
  if (!id && !a.nom?.trim()) return { ok: false, erreur: "Le nom est obligatoire." };
  const { supabase } = await getSession();
  const d = Object.fromEntries(Object.entries(a).filter(([k]) => CHAMPS.includes(k)).map(([k, v]) => [k, v === "" ? null : v]));
  // Passage en production sans date : on met la date du jour
  if (d.statut === "en_production" && !a.date_mise_en_service && !id) d.date_mise_en_service = new Date().toISOString().slice(0, 10);
  const { error } = id
    ? await supabase.from("client_automatisations").update(d).eq("id", id)
    : await supabase.from("client_automatisations").insert({ ...d, client_id: clientId });
  if (error) return { ok: false, erreur: error.message };
  rafraichir(clientId);
  return { ok: true };
}

export async function supprimerAutomatisation(id: string, clientId: string): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("client_automatisations").delete().eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  rafraichir(clientId);
  return { ok: true };
}

/** Marque tous les rappels d'upsell échus du client comme traités. */
export async function marquerUpsellTraite(clientId: string): Promise<R> {
  const { supabase } = await getSession();
  const { error } = await supabase
    .from("client_automatisations")
    .update({ upsell_traite: true })
    .eq("client_id", clientId)
    .lte("date_rappel_upsell", new Date().toISOString().slice(0, 10));
  if (error) return { ok: false, erreur: error.message };
  rafraichir(clientId);
  return { ok: true };
}
