"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { definirObjectifs } from "@/lib/actions/objectifs";
import { cn, euros } from "@/lib/utils";

type M = "rdv" | "signatures" | "ca";
const LIBELLES: Record<M, string> = { rdv: "RDV obtenus", signatures: "Signatures", ca: "CA signé (mise en place)" };

export function ObjectifsMois({ mois, libelleMois, realise, cibles }: { mois: string; libelleMois: string; realise: Record<M, number>; cibles: Record<M, number> }) {
  const router = useRouter();
  const [edition, setEdition] = useState(false);
  const [valeurs, setValeurs] = useState(cibles);
  const [enCours, startTransition] = useTransition();
  const fmt = (m: M, v: number) => (m === "ca" ? euros(v) : String(v));

  const enregistrer = () =>
    startTransition(async () => {
      const r = await definirObjectifs(valeurs, mois);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success(`Objectifs de ${libelleMois} enregistrés`);
      setEdition(false);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{libelleMois}</CardTitle>
        <CardDescription>Objectifs mensuels</CardDescription>
        <CardAction>
          {!edition && <Button size="xs" variant="ghost" onClick={() => setEdition(true)}><Pencil /> Ajuster ce mois</Button>}
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {(Object.keys(LIBELLES) as M[]).map((m) => {
          const pct = cibles[m] ? (realise[m] / cibles[m]) * 100 : 0;
          return (
            <div key={m} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{LIBELLES[m]}</span>
                {edition ? (
                  <Input type="number" min={0} aria-label={`Objectif ${LIBELLES[m]}`} className="h-7 w-28 text-right" value={valeurs[m]} onChange={(e) => setValeurs((v) => ({ ...v, [m]: Number(e.target.value) }))} />
                ) : (
                  <span className={cn("tabular-nums", pct >= 100 && "font-medium text-success")} data-testid={`mois-${m}`}>{fmt(m, realise[m])}<span className="text-muted-foreground"> / {fmt(m, cibles[m])}</span></span>
                )}
              </div>
              <Progress value={pct} indicatorClassName={pct >= 100 ? "bg-success" : undefined} />
            </div>
          );
        })}
        {edition && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { setValeurs(cibles); setEdition(false); }}>Annuler</Button>
            <Button size="sm" onClick={enregistrer} disabled={enCours}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
