import type { Metadata } from "next";
import { NouvelleProposition } from "@/components/propositions/nouvelle";
import { getOffres } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nouvelle proposition" };

export default async function PageNouvelle({ searchParams }: { searchParams: Promise<{ hotel?: string }> }) {
  const { hotel } = await searchParams;
  const { supabase } = await getSession();
  const [hotels, offres] = await Promise.all([supabase.from("hotels").select("id, nom, ville, douleurs").order("nom"), getOffres()]);
  return <NouvelleProposition hotels={hotels.data ?? []} offres={offres} hotelInitial={hotel} />;
}
