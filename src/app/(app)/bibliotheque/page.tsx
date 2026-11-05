import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Bibliothèque" };

export default function Page() {
  return <PageEntete titre="Bibliothèque" description="Module en cours de construction." />;
}
