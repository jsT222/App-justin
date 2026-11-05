import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { PageEntete } from "@/components/layout/page-entete";
import { Etoiles } from "@/components/hotel/etoiles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { caTotal, mrr } from "@/lib/calculs/clients";
import { STATUTS_CLIENT } from "@/lib/constantes";
import { normaliserNombres } from "@/lib/data";
import { aujourdhuiParis, dateCourte } from "@/lib/dates";
import { getSession } from "@/lib/supabase/server";
import type { ClientAutomatisation, ClientVue } from "@/lib/types";
import { euros } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients" };

export default async function PageClients() {
  const { supabase } = await getSession();
  const [c, a] = await Promise.all([
    supabase.from("v_clients").select("*").order("date_signature", { ascending: false }),
    supabase.from("client_automatisations").select("*"),
  ]);
  const clients = normaliserNombres(c.data ?? []) as ClientVue[];
  const autos = normaliserNombres(a.data ?? []) as ClientAutomatisation[];
  const autosDe = (id: string) => autos.filter((x) => x.client_id === id);
  const actifs = clients.filter((x) => x.statut === "actif");
  const mrrTotal = actifs.reduce((s, x) => s + mrr(autosDe(x.id)), 0);
  const ca = clients.reduce((s, x) => s + caTotal(autosDe(x.id)), 0);
  const auj = aujourdhuiParis();

  const Stat = ({ label, valeur, detail }: { label: string; valeur: string; detail?: string }) => (
    <Card className="gap-1 py-4">
      <CardHeader className="px-4"><CardDescription className="text-xs">{label}</CardDescription></CardHeader>
      <CardContent className="px-4"><p className="text-2xl font-semibold tabular-nums">{valeur}</p>{detail && <p className="text-xs text-muted-foreground">{detail}</p>}</CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageEntete titre="Clients" description="Hôtels signés, automatisations livrées et revenus récurrents." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Clients actifs" valeur={String(actifs.length)} detail={`${clients.length} au total`} />
        <Stat label="MRR" valeur={euros(mrrTotal)} detail={`${euros(mrrTotal * 12)} / an`} />
        <Stat label="CA total encaissé" valeur={euros(ca)} detail="Mises en place + maintenances" />
        <Stat label="Upsells à proposer" valeur={String(clients.filter((x) => x.prochain_upsell && x.prochain_upsell <= auj).length)} />
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Hôtel</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden md:table-cell">Automatisations</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="hidden text-right sm:table-cell">CA total</TableHead>
              <TableHead className="hidden lg:table-cell">Signé le</TableHead>
              <TableHead className="hidden lg:table-cell">Renouvellement</TableHead>
              <TableHead className="pr-4">Upsell</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((x) => {
              const as = autosDe(x.id);
              const du = x.prochain_upsell && x.prochain_upsell <= auj;
              return (
                <TableRow key={x.id} className="relative">
                  <TableCell className="pl-4">
                    <Link href={`/clients/${x.id}`} className="font-medium after:absolute after:inset-0 hover:underline">{x.hotel_nom}</Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Etoiles n={x.etoiles} />{x.ville}</div>
                  </TableCell>
                  <TableCell><Badge variant={x.statut === "actif" ? "success" : x.statut === "pause" ? "warning" : "secondary"}>{STATUTS_CLIENT[x.statut]}</Badge></TableCell>
                  <TableCell className="hidden max-w-64 truncate text-muted-foreground md:table-cell">{as.map((y) => y.nom).join(", ") || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{euros(mrr(as))}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{euros(caTotal(as))}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{dateCourte(x.date_signature)}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{dateCourte(x.date_renouvellement)}</TableCell>
                  <TableCell className="pr-4">
                    {du ? <Badge variant="warning"><Bell /> À proposer</Badge> : x.prochain_upsell ? <span className="text-xs text-muted-foreground">{dateCourte(x.prochain_upsell)}</span> : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {clients.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Pas encore de client. Passe un prospect en « Gagné » !</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
