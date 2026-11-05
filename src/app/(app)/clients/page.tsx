import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Clients" };

export default function Page() {
  return <PageEntete titre="Clients" description="Module en cours de construction." />;
}
