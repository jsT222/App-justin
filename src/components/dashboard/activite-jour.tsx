"use client";

import { useOptimistic, useTransition } from "react";
import { Mail, Minus, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { LinkedinIcon } from "@/components/icones";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { incrementerActivite } from "@/lib/actions/activite";
import { cn } from "@/lib/utils";

type Metrique = "linkedin" | "appels" | "emails";
const LIGNES: { m: Metrique; label: string; bouton: string; icone: React.ComponentType<{ className?: string }> }[] = [
  { m: "linkedin", label: "Messages LinkedIn", bouton: "+1 message envoyé", icone: LinkedinIcon },
  { m: "appels", label: "Appels", bouton: "+1 appel", icone: Phone },
  { m: "emails", label: "Emails", bouton: "+1 email", icone: Mail },
];

export function ActiviteJour({ valeurs, objectifs, compact }: { valeurs: Record<Metrique, number>; objectifs: Record<Metrique, number>; compact?: boolean }) {
  const [, startTransition] = useTransition();
  const [opt, ajouter] = useOptimistic(valeurs, (etat, { m, d }: { m: Metrique; d: number }) => ({ ...etat, [m]: Math.max(0, etat[m] + d) }));

  const changer = (m: Metrique, d: number) =>
    startTransition(async () => {
      ajouter({ m, d });
      const r = await incrementerActivite(m, d);
      if (!r.ok) toast.error(r.erreur);
    });

  return (
    <div className="grid gap-4">
      {LIGNES.map(({ m, label, bouton, icone: Icone }) => {
        const v = opt[m];
        const obj = objectifs[m] || 0;
        const pct = obj ? (v / obj) * 100 : 0;
        return (
          <div key={m} className="grid gap-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Icone className="size-4 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <span className={cn("tabular-nums", pct >= 100 && "font-medium text-success")} data-testid={`activite-${m}`}>
                {v}<span className="text-muted-foreground"> / {obj}</span>
              </span>
              {!compact && (
                <Button variant="ghost" size="icon-xs" aria-label={`Retirer 1 (${label})`} onClick={() => changer(m, -1)} disabled={v === 0}>
                  <Minus />
                </Button>
              )}
              <Button variant="outline" size="xs" aria-label={bouton} onClick={() => changer(m, 1)}>
                <Plus /> 1
              </Button>
            </div>
            <Progress value={pct} indicatorClassName={pct >= 100 ? "bg-success" : undefined} />
          </div>
        );
      })}
    </div>
  );
}
