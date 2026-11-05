"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRaccourcis } from "./raccourcis";

export function BoutonRecherche({ large }: { large?: boolean }) {
  const { ouvrirPalette } = useRaccourcis();
  if (!large) return <Button variant="ghost" size="icon-sm" aria-label="Rechercher" onClick={ouvrirPalette}><Search /></Button>;
  return (
    <button onClick={ouvrirPalette} className="flex h-8 items-center gap-2 rounded-md border bg-background px-2 text-sm text-muted-foreground hover:bg-accent">
      <Search className="size-4" />
      <span className="flex-1 text-left">Rechercher…</span>
      <kbd className="rounded border px-1 text-[10px]">⌘K</kbd>
    </button>
  );
}
