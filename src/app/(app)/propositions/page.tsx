import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Propositions" };

export default function Page() {
  return <PageEntete titre="Propositions" description="Module en cours de construction." />;
}
