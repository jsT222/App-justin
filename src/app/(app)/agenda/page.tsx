import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Agenda" };

export default function Page() {
  return <PageEntete titre="Agenda" description="Module en cours de construction." />;
}
