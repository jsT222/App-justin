import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Objectifs" };

export default function Page() {
  return <PageEntete titre="Objectifs" description="Module en cours de construction." />;
}
