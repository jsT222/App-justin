"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { LigneRelance } from "@/components/hotel/prochaines-actions";
import { RelanceDialog, type HotelOption } from "@/components/hotel/relance-dialog";
import { PageEntete } from "@/components/layout/page-entete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PARIS, estEnRetard } from "@/lib/dates";
import type { Relance, RelanceAvecHotel } from "@/lib/types";
import { cn } from "@/lib/utils";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function groupes(relances: RelanceAvecHotel[]) {
  const auj = new Date();
  const g: { titre: string; items: RelanceAvecHotel[]; danger?: boolean }[] = [
    { titre: "En retard", items: [], danger: true },
    { titre: "Aujourd'hui", items: [] },
    { titre: "Demain", items: [] },
    { titre: "Cette semaine", items: [] },
    { titre: "Plus tard", items: [] },
  ];
  const finSemaine = endOfWeek(auj, { weekStartsOn: 1, ...PARIS });
  for (const r of relances) {
    const d = new Date(r.date_prevue);
    if (estEnRetard(d)) g[0].items.push(r);
    else if (isSameDay(d, auj, PARIS)) g[1].items.push(r);
    else if (isSameDay(d, addDays(auj, 1), PARIS)) g[2].items.push(r);
    else if (d <= finSemaine) g[3].items.push(r);
    else g[4].items.push(r);
  }
  return g.filter((x) => x.items.length);
}

export function Agenda({
  mois,
  vue,
  calendrier,
  aFaire,
  hotels,
}: {
  mois: string;
  vue: "liste" | "calendrier";
  calendrier: RelanceAvecHotel[];
  aFaire: RelanceAvecHotel[];
  hotels: HotelOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = new Date(mois);
  const [dialog, setDialog] = useState<{ relance?: Relance; type?: "rdv" | "appel" } | null>(null);
  const [jourSel, setJourSel] = useState<Date | null>(null);

  const naviguer = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ vue, mois: format(ref, "yyyy-MM", PARIS), ...params });
    router.push(`${pathname}?${sp}`);
  };

  const jours = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(ref, PARIS), { weekStartsOn: 1, ...PARIS }),
        end: endOfWeek(endOfMonth(ref, PARIS), { weekStartsOn: 1, ...PARIS }),
      }, PARIS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mois],
  );

  const parJour = (j: Date) => calendrier.filter((r) => isSameDay(new Date(r.date_prevue), j, PARIS));
  const listeJour = jourSel ? parJour(jourSel) : [];

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageEntete
        titre="Agenda"
        description={`${aFaire.length} action(s) à faire · ${aFaire.filter((r) => estEnRetard(r.date_prevue)).length} en retard`}
        actions={
          <>
            <Tabs value={vue} onValueChange={(v) => naviguer({ vue: v })}>
              <TabsList>
                <TabsTrigger value="liste"><List /> À faire</TabsTrigger>
                <TabsTrigger value="calendrier"><CalendarDays /> Calendrier</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" variant="outline" onClick={() => setDialog({ type: "rdv" })}><Plus /> RDV</Button>
            <Button size="sm" onClick={() => setDialog({ type: "appel" })}><Plus /> Relance</Button>
          </>
        }
      />

      {vue === "liste" ? (
        <div className="grid gap-4">
          {aFaire.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Tout est à jour 🎉</CardContent></Card>}
          {groupes(aFaire).map((g) => (
            <Card key={g.titre} className={cn("gap-2", g.danger && "border-destructive/40")}>
              <CardHeader>
                <CardTitle className={cn(g.danger && "text-destructive")}>{g.titre} <span className="font-normal text-muted-foreground">· {g.items.length}</span></CardTitle>
              </CardHeader>
              <CardContent className="grid gap-0.5">
                {g.items.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1"><LigneRelance r={r} avecHotel onModifier={() => setDialog({ relance: r })} /></div>
                    {r.hotels && (
                      <Link href={`/prospects/${r.hotels.id}`} className="hidden shrink-0 text-xs text-muted-foreground hover:text-foreground sm:block">Fiche →</Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="gap-3 py-4">
          <CardHeader className="flex flex-row items-center justify-between px-4">
            <CardTitle className="text-base capitalize">{format(ref, "MMMM yyyy", { locale: fr, ...PARIS })}</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" aria-label="Mois précédent" onClick={() => naviguer({ mois: format(addMonths(ref, -1), "yyyy-MM", PARIS) })}><ChevronLeft /></Button>
              <Button variant="outline" size="sm" onClick={() => naviguer({ mois: format(new Date(), "yyyy-MM", PARIS) })}>Aujourd&apos;hui</Button>
              <Button variant="outline" size="icon-sm" aria-label="Mois suivant" onClick={() => naviguer({ mois: format(addMonths(ref, 1), "yyyy-MM", PARIS) })}><ChevronRight /></Button>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            <div className="grid grid-cols-7 overflow-hidden rounded-lg border text-xs">
              {JOURS.map((j) => <div key={j} className="border-b bg-muted/50 px-2 py-1.5 font-medium text-muted-foreground">{j}</div>)}
              {jours.map((j) => {
                const items = parJour(j);
                const auj = isSameDay(j, new Date(), PARIS);
                return (
                  <button
                    key={j.toISOString()}
                    onClick={() => setJourSel(j)}
                    aria-label={`${format(j, "EEEE d MMMM", { locale: fr, ...PARIS })} : ${items.length} élément(s)`}
                    className={cn(
                      "flex min-h-16 flex-col gap-0.5 border-r border-b p-1 text-left align-top transition-colors last:border-r-0 hover:bg-accent/50 sm:min-h-24 [&:nth-child(7n)]:border-r-0",
                      !isSameMonth(j, ref, PARIS) && "bg-muted/30 text-muted-foreground",
                      jourSel && isSameDay(j, jourSel, PARIS) && "ring-2 ring-primary ring-inset",
                    )}
                  >
                    <span className={cn("flex size-5 items-center justify-center rounded-full", auj && "bg-primary text-primary-foreground")}>{format(j, "d", PARIS)}</span>
                    {items.slice(0, 3).map((r) => (
                      <span
                        key={r.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                          r.type === "rdv" ? "bg-violet-500/15 text-violet-700 dark:text-violet-300" : "bg-muted",
                          r.statut === "fait" && "line-through opacity-50",
                          r.statut === "a_faire" && estEnRetard(r.date_prevue) && "bg-destructive/10 text-destructive",
                        )}
                      >
                        <span className="hidden sm:inline">{format(new Date(r.date_prevue), "HH:mm", PARIS)} </span>
                        {r.hotels?.nom ?? r.titre}
                      </span>
                    ))}
                    {items.length > 3 && <span className="px-1 text-[11px] text-muted-foreground">+{items.length - 3}</span>}
                  </button>
                );
              })}
            </div>
            {jourSel && (
              <div className="mt-4 grid gap-1">
                <p className="text-sm font-medium capitalize">{format(jourSel, "EEEE d MMMM", { locale: fr, ...PARIS })}</p>
                {listeJour.length === 0 && <p className="text-sm text-muted-foreground">Rien de prévu.</p>}
                {listeJour.map((r) => <LigneRelance key={r.id} r={r} avecHotel onModifier={() => setDialog({ relance: r })} />)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <RelanceDialog ouvert={!!dialog} onOpenChange={(o) => !o && setDialog(null)} hotels={hotels} relance={dialog?.relance} typeInitial={dialog?.type} />
    </div>
  );
}
