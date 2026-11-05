import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return <PageEntete titre="Paramètres" description="Module en cours de construction." />;
}
