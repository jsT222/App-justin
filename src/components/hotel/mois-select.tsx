"use client";

import { MOIS, MOIS_COURTS } from "@/lib/constantes";
import { cn } from "@/lib/utils";

export function MoisSelect({ valeurs, onChange, couleur = "primary", label }: { valeurs: number[]; onChange: (v: number[]) => void; couleur?: "primary" | "amber"; label: string }) {
  return (
    <div className="grid grid-cols-6 gap-1 sm:grid-cols-12" role="group" aria-label={label}>
      {MOIS_COURTS.map((m, i) => {
        const n = i + 1;
        const actif = valeurs.includes(n);
        return (
          <button
            key={m}
            type="button"
            aria-pressed={actif}
            title={MOIS[i]}
            onClick={() => onChange(actif ? valeurs.filter((x) => x !== n) : [...valeurs, n].sort((a, b) => a - b))}
            className={cn(
              "h-7 rounded-md border text-xs capitalize transition-colors",
              actif
                ? couleur === "amber"
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "border-primary/40 bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {m.replace(".", "")}
          </button>
        );
      })}
    </div>
  );
}

export function resumeMois(mois: number[] | null | undefined) {
  if (!mois?.length) return "—";
  return mois.map((m) => MOIS_COURTS[m - 1]).join(", ");
}
