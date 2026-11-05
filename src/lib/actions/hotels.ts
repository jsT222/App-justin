"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/server";
import { isoParis } from "@/lib/dates";
import { cleDoublon } from "@/lib/utils";
import type { Contact, Hotel, RaisonPerte, Relance, TypeInteraction } from "@/lib/types";

export type Resultat<T = undefined> = { ok: true; data?: T } | { ok: false; erreur: string };

const echec = (e: { message: string } | null | undefined, defaut = "Une erreur est survenue."): Resultat<never> => ({
  ok: false,
  erreur: e?.message ?? defaut,
});

function rafraichir(hotelId?: string) {
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
  revalidatePath("/clients");
  if (hotelId) revalidatePath(`/prospects/${hotelId}`);
}

/** Champs modifiables d'un hôtel (les colonnes calculées sont exclues). */
export type HotelSaisie = Partial<Omit<Hotel, "id" | "user_id" | "cle_doublon" | "created_at" | "updated_at" | "date_entree_etape">>;

const COLONNES_MODIFIABLES = new Set([
  "nom", "adresse", "code_postal", "ville", "departement", "site_web", "url_booking", "url_google_maps",
  "etoiles", "nb_chambres", "type_hotel", "services", "ouverture", "mois_haute_saison", "mois_creux",
  "note_google", "nb_avis_google", "note_booking", "nb_avis_booking", "pms", "channel_manager",
  "moteur_reservation", "crm", "source", "etape_id", "priorite", "montant_setup_estime",
  "montant_mensuel_estime", "probabilite", "douleurs", "raison_perte", "detail_perte", "date_recontact",
]);

/** Ne garde que les colonnes modifiables (exclut id, colonnes calculées et champs de la vue). */
function nettoyer(h: HotelSaisie): HotelSaisie {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(h)) {
    if (v === undefined || !COLONNES_MODIFIABLES.has(k)) continue;
    r[k] = typeof v === "string" ? v.trim() || null : v;
  }
  if ("nom" in r && !r.nom) delete r.nom;
  return r as HotelSaisie;
}

// ---------------------------------------------------------------- hôtels

export async function creerHotel(saisie: HotelSaisie): Promise<Resultat<{ id: string }>> {
  if (!saisie.nom?.trim()) return { ok: false, erreur: "Le nom de l'hôtel est obligatoire." };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("hotels").insert(nettoyer(saisie)).select("id").single();
  if (error) return echec(error);
  rafraichir();
  return { ok: true, data: { id: data.id } };
}

export async function majHotel(id: string, saisie: HotelSaisie): Promise<Resultat> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("hotels").update(nettoyer(saisie)).eq("id", id);
  if (error) return echec(error);
  rafraichir(id);
  return { ok: true };
}

export async function supprimerHotel(id: string): Promise<Resultat> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("hotels").delete().eq("id", id);
  if (error) return echec(error);
  rafraichir();
  return { ok: true };
}

/** Recherche d'hôtels existants avec la même clé nom + ville. */
export async function chercherDoublons(nom: string, ville: string | null, exclureId?: string) {
  const { supabase } = await getSession();
  let q = supabase.from("hotels").select("id, nom, ville").eq("cle_doublon", cleDoublon(nom, ville));
  if (exclureId) q = q.neq("id", exclureId);
  const { data } = await q;
  return (data ?? []) as Pick<Hotel, "id" | "nom" | "ville">[];
}

/**
 * Change l'étape d'un hôtel. Les triggers SQL gèrent : journal, probabilité,
 * séquences de relance, création du client si « Gagné ».
 */
export async function changerEtape(
  id: string,
  etapeId: string,
  perte?: { raison: RaisonPerte; detail?: string; dateRecontact?: string | null },
): Promise<Resultat> {
  const { supabase } = await getSession();
  const maj: HotelSaisie = { etape_id: etapeId };
  if (perte) {
    maj.raison_perte = perte.raison;
    maj.detail_perte = perte.detail?.trim() || null;
    maj.date_recontact = perte.dateRecontact || null;
  }
  const { error } = await supabase.from("hotels").update(maj).eq("id", id);
  if (error) return echec(error);

  if (perte?.dateRecontact) {
    const { data: h } = await supabase.from("hotels").select("nom").eq("id", id).single();
    await supabase.from("relances").insert({
      hotel_id: id,
      type: "appel",
      titre: `Recontacter ${h?.nom ?? ""}`.trim(),
      date_prevue: isoParis(perte.dateRecontact, 9),
    });
  }
  rafraichir(id);
  return { ok: true };
}

// ---------------------------------------------------------------- contacts

export type ContactSaisie = Partial<Omit<Contact, "id" | "created_at">> & { hotel_id: string };

export async function enregistrerContact(saisie: ContactSaisie, id?: string): Promise<Resultat> {
  const { supabase } = await getSession();
  const CHAMPS = ["prenom", "nom", "poste", "role_decision", "email", "telephone", "linkedin", "est_principal", "notes"];
  const donnees = Object.fromEntries(
    Object.entries(saisie)
      .filter(([k]) => CHAMPS.includes(k))
      .map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]),
  ) as ContactSaisie;
  donnees.hotel_id = saisie.hotel_id;

  if (donnees.est_principal) {
    await supabase.from("contacts").update({ est_principal: false }).eq("hotel_id", saisie.hotel_id);
  } else if (!id) {
    // Le premier contact devient principal
    const { count } = await supabase.from("contacts").select("id", { count: "exact", head: true }).eq("hotel_id", saisie.hotel_id);
    if (!count) donnees.est_principal = true;
  }

  const { error } = id
    ? await supabase.from("contacts").update(donnees).eq("id", id)
    : await supabase.from("contacts").insert(donnees);
  if (error) return echec(error);
  rafraichir(saisie.hotel_id);
  return { ok: true };
}

export async function supprimerContact(id: string, hotelId: string): Promise<Resultat> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return echec(error);
  rafraichir(hotelId);
  return { ok: true };
}

// ---------------------------------------------------------------- interactions

export async function ajouterInteraction(
  hotelId: string,
  type: TypeInteraction,
  contenu: string,
  contactId?: string | null,
): Promise<Resultat> {
  if (!contenu.trim() && type === "note") return { ok: false, erreur: "La note est vide." };
  const { supabase } = await getSession();
  const { error } = await supabase
    .from("interactions")
    .insert({ hotel_id: hotelId, type, contenu: contenu.trim(), contact_id: contactId || null });
  if (error) return echec(error);
  rafraichir(hotelId);
  revalidatePath("/objectifs");
  return { ok: true };
}

export async function supprimerInteraction(id: string, hotelId: string): Promise<Resultat> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("interactions").delete().eq("id", id);
  if (error) return echec(error);
  rafraichir(hotelId);
  return { ok: true };
}

// ---------------------------------------------------------------- relances / RDV

export type RelanceSaisie = Pick<Relance, "hotel_id" | "type" | "titre" | "date_prevue"> &
  Partial<Pick<Relance, "duree_min" | "lieu_ou_lien" | "contact_id">>;

export async function enregistrerRelance(saisie: RelanceSaisie, id?: string): Promise<Resultat> {
  if (!saisie.titre.trim()) return { ok: false, erreur: "Le titre est obligatoire." };
  const { supabase } = await getSession();
  const donnees = { ...saisie, titre: saisie.titre.trim(), lieu_ou_lien: saisie.lieu_ou_lien?.trim() || null };
  const { error } = id
    ? await supabase.from("relances").update(donnees).eq("id", id)
    : await supabase.from("relances").insert(donnees);
  if (error) return echec(error);
  rafraichir(saisie.hotel_id);
  return { ok: true };
}

export async function changerStatutRelance(id: string, statut: Relance["statut"]): Promise<Resultat> {
  const { supabase } = await getSession();
  const { data, error } = await supabase
    .from("relances")
    .update({ statut, fait_le: statut === "fait" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("hotel_id")
    .single();
  if (error) return echec(error);
  rafraichir(data.hotel_id);
  return { ok: true };
}

export async function reporterRelance(id: string, nouvelleDate: string): Promise<Resultat> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("relances").update({ date_prevue: nouvelleDate }).eq("id", id).select("hotel_id").single();
  if (error) return echec(error);
  rafraichir(data.hotel_id);
  return { ok: true };
}

export async function supprimerRelance(id: string): Promise<Resultat> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("relances").delete().eq("id", id).select("hotel_id").single();
  if (error) return echec(error);
  rafraichir(data.hotel_id);
  return { ok: true };
}

// ---------------------------------------------------------------- import CSV

export interface LigneImport {
  hotel: HotelSaisie;
  contact?: Omit<ContactSaisie, "hotel_id">;
}

export async function importerHotels(lignes: LigneImport[]): Promise<Resultat<{ crees: number }>> {
  if (!lignes.length) return { ok: false, erreur: "Aucune ligne à importer." };
  if (lignes.length > 2000) return { ok: false, erreur: "2000 lignes maximum par import." };
  const { supabase } = await getSession();

  const { data: hotels, error } = await supabase
    .from("hotels")
    .insert(lignes.map((l) => nettoyer(l.hotel)))
    .select("id");
  if (error) return echec(error);

  const contacts = lignes
    .map((l, i) => (l.contact && Object.values(l.contact).some(Boolean) ? { ...l.contact, hotel_id: hotels[i].id, est_principal: true } : null))
    .filter((c): c is NonNullable<typeof c> => c !== null);
  if (contacts.length) {
    const { error: e2 } = await supabase.from("contacts").insert(contacts);
    if (e2) return echec(e2, "Hôtels importés, mais erreur sur les contacts.");
  }
  rafraichir();
  return { ok: true, data: { crees: hotels.length } };
}
