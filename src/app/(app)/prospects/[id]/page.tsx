import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEtapes, getListes, getOffres, normaliserNombres } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { Contact, HotelVue, Interaction, Proposition, Relance } from "@/lib/types";
import { FicheHotel } from "@/components/hotel/fiche-hotel";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from("hotels").select("nom").eq("id", id).maybeSingle();
  return { title: data?.nom ?? "Prospect" };
}

export default async function PageFiche({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await getSession();
  const [hotel, contacts, interactions, relances, propositions, etapes, listes, offres] = await Promise.all([
    supabase.from("v_hotels").select("*").eq("id", id).maybeSingle(),
    supabase.from("contacts").select("*").eq("hotel_id", id).order("est_principal", { ascending: false }).order("created_at"),
    supabase.from("interactions").select("*").eq("hotel_id", id).order("date", { ascending: false }).limit(200),
    supabase.from("relances").select("*").eq("hotel_id", id).eq("statut", "a_faire").order("date_prevue"),
    supabase.from("propositions").select("*").eq("hotel_id", id).order("created_at", { ascending: false }),
    getEtapes(),
    getListes(),
    getOffres(),
  ]);
  if (!hotel.data) notFound();

  return (
    <FicheHotel
      hotel={normaliserNombres([hotel.data])[0] as HotelVue}
      contacts={(contacts.data ?? []) as Contact[]}
      interactions={(interactions.data ?? []) as Interaction[]}
      relances={(relances.data ?? []) as Relance[]}
      propositions={normaliserNombres(propositions.data ?? []) as Proposition[]}
      etapes={etapes}
      listes={listes}
      offres={offres}
    />
  );
}
