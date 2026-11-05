import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditeurProposition } from "@/components/propositions/editeur";
import { getOffres, normaliserNombres } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { LigneProposition, Proposition } from "@/lib/types";

export const metadata: Metadata = { title: "Proposition" };

export default async function PageProposition({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await getSession();
  const [p, lignes, offres] = await Promise.all([
    supabase.from("propositions").select("*, hotels(id, nom, ville)").eq("id", id).maybeSingle(),
    supabase.from("lignes_proposition").select("*").eq("proposition_id", id).order("ordre"),
    getOffres(),
  ]);
  if (!p.data) notFound();
  return (
    <EditeurProposition
      proposition={normaliserNombres([p.data])[0] as Proposition & { hotels: { id: string; nom: string; ville: string | null } }}
      lignes={normaliserNombres(lignes.data ?? []) as LigneProposition[]}
      offres={offres}
    />
  );
}
