import type { Metadata } from "next";
import { Bibliotheque } from "@/components/bibliotheque/bibliotheque";
import { getListes, getOffres } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { ModeleMessage } from "@/lib/types";

export const metadata: Metadata = { title: "Bibliothèque" };

export default async function PageBibliotheque({ searchParams }: { searchParams: Promise<{ onglet?: string; hotel?: string }> }) {
  const { onglet, hotel } = await searchParams;
  const { supabase } = await getSession();
  const [offres, modeles, hotels, contacts, listes] = await Promise.all([
    getOffres(false),
    supabase.from("modeles_messages").select("*").order("ordre"),
    supabase.from("hotels").select("id, nom, ville, etoiles, nb_chambres").order("nom"),
    supabase.from("contacts").select("hotel_id, prenom").eq("est_principal", true),
    getListes(),
  ]);
  const prenoms = new Map((contacts.data ?? []).map((c) => [c.hotel_id, c.prenom]));
  return (
    <Bibliotheque
      onglet={onglet === "modeles" ? "modeles" : "offres"}
      offres={offres}
      modeles={(modeles.data ?? []) as ModeleMessage[]}
      hotels={(hotels.data ?? []).map((h) => ({ ...h, prenom: prenoms.get(h.id) ?? null }))}
      hotelInitial={hotel}
      douleurs={listes.douleur}
    />
  );
}
