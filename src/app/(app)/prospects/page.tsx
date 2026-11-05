import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Prospects" };

export default function Page() {
  return <PageEntete titre="Prospects" description="Module en cours de construction." />;
}
