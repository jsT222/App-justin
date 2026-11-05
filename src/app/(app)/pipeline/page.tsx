import type { Metadata } from "next";
import { getEtapes, getHotelsVue, getListes } from "@/lib/data";
import { Kanban } from "@/components/pipeline/kanban";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PagePipeline() {
  const [hotels, etapes, listes] = await Promise.all([getHotelsVue(), getEtapes(), getListes()]);
  return <Kanban hotels={hotels} etapes={etapes} listes={listes} />;
}
