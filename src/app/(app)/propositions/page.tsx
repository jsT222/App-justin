import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageEntete } from "@/components/layout/page-entete";
import { ListePropositions } from "@/components/propositions/liste";
import { Button } from "@/components/ui/button";
import { normaliserNombres } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { Proposition } from "@/lib/types";

export const metadata: Metadata = { title: "Propositions" };

export default async function PagePropositions() {
  const { supabase } = await getSession();
  const { data } = await supabase.from("propositions").select("*, hotels(id, nom, ville)").order("created_at", { ascending: false });
  const props = normaliserNombres(data ?? []) as (Proposition & { hotels: { id: string; nom: string; ville: string | null } | null })[];
  return (
    <div className="grid grid-cols-1 gap-4">
      <PageEntete
        titre="Propositions"
        description="Devis : mise en place (ponctuel) + maintenance (mensuel)."
        actions={<Button size="sm" asChild><Link href="/propositions/nouvelle"><Plus /> Nouvelle proposition</Link></Button>}
      />
      <ListePropositions propositions={props} />
    </div>
  );
}
