import { couleurEtape } from "@/lib/constantes";
import { cn } from "@/lib/utils";

export function EtapeBadge({ nom, couleur, className }: { nom: string | null; couleur: string | null; className?: string }) {
  const c = couleurEtape(couleur);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", c.badge, className)}>
      <span className={cn("size-1.5 rounded-full", c.pastille)} />
      {nom ?? "—"}
    </span>
  );
}

export function PrioriteBadge({ priorite }: { priorite: string | null }) {
  if (priorite === "haute") return <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">Haute</span>;
  if (priorite === "basse") return <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Basse</span>;
  return <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-700 dark:text-amber-400">Moyenne</span>;
}
