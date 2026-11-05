"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUTS_PROPOSITION } from "@/lib/constantes";
import { dateCourte } from "@/lib/dates";
import type { Proposition, StatutProposition } from "@/lib/types";
import { euros } from "@/lib/utils";

export const variantStatut = (s: StatutProposition) =>
  s === "acceptee" ? "success" : s === "refusee" ? "destructive" : s === "envoyee" ? "default" : "secondary";

export function ListePropositions({ propositions }: { propositions: (Proposition & { hotels: { nom: string; ville: string | null } | null })[] }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<"tous" | StatutProposition>("tous");
  const visibles = propositions.filter((p) => filtre === "tous" || p.statut === filtre);
  const envoyees = propositions.filter((p) => p.statut === "envoyee");
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filtre} onValueChange={(v) => setFiltre(v as typeof filtre)}>
          <TabsList>
            <TabsTrigger value="tous">Toutes</TabsTrigger>
            {(Object.keys(STATUTS_PROPOSITION) as StatutProposition[]).map((s) => (
              <TabsTrigger key={s} value={s}>{STATUTS_PROPOSITION[s]} ({propositions.filter((p) => p.statut === s).length})</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground">
          En attente de réponse : <span className="font-medium text-foreground">{euros(envoyees.reduce((s, p) => s + p.total_setup, 0))}</span> + {euros(envoyees.reduce((s, p) => s + p.total_mensuel, 0))}/mois
        </p>
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Numéro</TableHead>
              <TableHead>Hôtel</TableHead>
              <TableHead className="hidden md:table-cell">Titre</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Mise en place</TableHead>
              <TableHead className="text-right">Mensuel</TableHead>
              <TableHead className="hidden pr-4 sm:table-cell">Envoyée le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/propositions/${p.id}`)}>
                <TableCell className="pl-4 font-mono text-xs">{p.numero}</TableCell>
                <TableCell className="font-medium">{p.hotels?.nom}</TableCell>
                <TableCell className="hidden max-w-72 truncate text-muted-foreground md:table-cell">{p.titre}</TableCell>
                <TableCell><Badge variant={variantStatut(p.statut)}>{STATUTS_PROPOSITION[p.statut]}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{euros(p.total_setup)}</TableCell>
                <TableCell className="text-right tabular-nums">{euros(p.total_mensuel)}</TableCell>
                <TableCell className="hidden pr-4 text-muted-foreground sm:table-cell">{dateCourte(p.date_envoi)}</TableCell>
              </TableRow>
            ))}
            {visibles.length === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Aucune proposition.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
