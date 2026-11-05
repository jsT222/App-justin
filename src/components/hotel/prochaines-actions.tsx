"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { Check, Clock, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { changerStatutRelance, reporterRelance, supprimerRelance } from "@/lib/actions/hotels";
import { TYPES_RELANCE } from "@/lib/constantes";
import { dateRelative, estEnRetard } from "@/lib/dates";
import type { Relance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RelanceDialog } from "./relance-dialog";

/** Ligne de relance avec actions : fait, reporter, modifier, annuler. */
export function LigneRelance({ r, onModifier, avecHotel }: { r: Relance & { hotels?: { id: string; nom: string } | null }; onModifier?: () => void; avecHotel?: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const retard = estEnRetard(r.date_prevue) && r.statut === "a_faire";

  const agir = (fn: () => Promise<{ ok: boolean; erreur?: string }>, msg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.erreur);
      toast.success(msg);
      router.refresh();
    });

  const reporter = (jours: number) => {
    const base = new Date(r.date_prevue) < new Date() ? new Date() : new Date(r.date_prevue);
    const d = addDays(base, jours);
    d.setHours(new Date(r.date_prevue).getHours(), new Date(r.date_prevue).getMinutes(), 0, 0);
    agir(() => reporterRelance(r.id, d.toISOString()), `Reporté au ${dateRelative(d, false).toLowerCase()}`);
  };

  return (
    <div className={cn("group flex items-center gap-2 rounded-md px-1 py-1.5", retard && "bg-destructive/5")}>
      <button
        onClick={() => agir(() => changerStatutRelance(r.id, "fait"), "Fait ✓")}
        aria-label={`Marquer « ${r.titre} » comme fait`}
        className={cn(
          "flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-success hover:bg-success/10",
          retard && "border-destructive/60",
        )}
      >
        <Check className="size-3 opacity-0 group-hover:opacity-60" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {avecHotel && r.hotels && <span className="font-medium">{r.hotels.nom} · </span>}
          {r.titre}
        </p>
        <p className={cn("text-xs text-muted-foreground", retard && "font-medium text-destructive")}>
          {retard && "En retard · "}
          {dateRelative(r.date_prevue)} · {TYPES_RELANCE[r.type]}
          {r.sequence_jour && <Badge variant="outline" className="ml-1.5 px-1 py-0 text-[10px]">Séquence J+{r.sequence_jour}</Badge>}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Plus d'actions"><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => reporter(1)}><Clock /> Reporter à demain</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => reporter(3)}><Clock /> Reporter de 3 jours</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => reporter(7)}><Clock /> Reporter d&apos;une semaine</DropdownMenuItem>
          <DropdownMenuSeparator />
          {onModifier && <DropdownMenuItem onSelect={onModifier}><Pencil /> Modifier</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => agir(() => changerStatutRelance(r.id, "annule"), "Relance annulée")}><X /> Annuler</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => agir(() => supprimerRelance(r.id), "Supprimée")}><Trash2 /> Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ProchainesActions({ hotelId, relances }: { hotelId: string; relances: Relance[] }) {
  const [dialog, setDialog] = useState<{ relance?: Relance; type?: "rdv" | "appel" } | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prochaines actions</CardTitle>
        <CardAction className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={() => setDialog({ type: "rdv" })}>RDV</Button>
          <Button variant="ghost" size="xs" onClick={() => setDialog({ type: "appel" })}><Plus /> Relance</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-0.5">
        {relances.length === 0 && <p className="text-sm text-muted-foreground">Rien de prévu. Planifie la prochaine étape !</p>}
        {relances.map((r) => <LigneRelance key={r.id} r={r} onModifier={() => setDialog({ relance: r })} />)}
      </CardContent>
      <RelanceDialog
        ouvert={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        hotelId={hotelId}
        relance={dialog?.relance}
        typeInitial={dialog?.type}
      />
    </Card>
  );
}
