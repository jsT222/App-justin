"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Etoiles({ n, className }: { n: number | null | undefined; className?: string }) {
  if (!n) return null;
  return (
    <span className={cn("inline-flex items-center gap-px text-amber-500", className)} aria-label={`${n} étoiles`} title={`${n} étoiles`}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="size-3 fill-current" />
      ))}
    </span>
  );
}

export function SaisieEtoiles({ valeur, onChange }: { valeur: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Catégorie">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valeur === i}
          aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          onClick={() => onChange(valeur === i ? null : i)}
          className="rounded p-0.5 text-amber-500 hover:bg-accent"
        >
          <Star className={cn("size-5", valeur && i <= valeur ? "fill-current" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}
