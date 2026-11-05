import type { Metadata } from "next";
import { getEtapes, getHotelsVue, getListes } from "@/lib/data";
import { ProspectsTable } from "@/components/prospects/prospects-table";

export const metadata: Metadata = { title: "Prospects" };

export default async function PageProspects() {
  const [hotels, etapes, listes] = await Promise.all([getHotelsVue(), getEtapes(), getListes()]);
  return <ProspectsTable hotels={hotels} etapes={etapes} listes={listes} />;
}
