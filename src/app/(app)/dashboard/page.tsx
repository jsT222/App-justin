import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <PageEntete titre="Dashboard" description="Module en cours de construction." />;
}
