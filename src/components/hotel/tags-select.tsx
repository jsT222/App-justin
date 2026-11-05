"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Sélection multiple de tags avec ajout libre. */
export function TagsSelect({
  valeurs,
  options,
  onChange,
  placeholder = "Ajouter…",
  ariaLabel,
}: {
  valeurs: string[];
  options: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const toutes = Array.from(new Set([...options, ...valeurs]));
  const basculer = (v: string) => onChange(valeurs.includes(v) ? valeurs.filter((x) => x !== v) : [...valeurs, v]);
  const nouvelle = recherche.trim() && !toutes.some((o) => o.toLowerCase() === recherche.trim().toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {valeurs.map((v) => (
        <Badge key={v} variant="secondary" className="gap-1 pr-1">
          {v}
          <button type="button" aria-label={`Retirer ${v}`} onClick={() => basculer(v)} className="rounded-sm opacity-60 hover:opacity-100">
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Popover open={ouvert} onOpenChange={setOuvert}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="xs" aria-label={ariaLabel ?? placeholder} className="border-dashed text-muted-foreground">
            <Plus /> {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher ou créer…" value={recherche} onValueChange={setRecherche} />
            <CommandList>
              <CommandEmpty>Aucun résultat</CommandEmpty>
              <CommandGroup>
                {toutes.map((o) => (
                  <CommandItem key={o} value={o} onSelect={() => basculer(o)}>
                    <Check className={cn("size-4", valeurs.includes(o) ? "opacity-100" : "opacity-0")} />
                    {o}
                  </CommandItem>
                ))}
                {nouvelle && (
                  <CommandItem
                    value={`__creer__${recherche}`}
                    onSelect={() => {
                      basculer(recherche.trim());
                      setRecherche("");
                    }}
                  >
                    <Plus className="size-4" /> Créer « {recherche.trim()} »
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
