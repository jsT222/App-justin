"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function FiltreMulti({
  label,
  options,
  valeurs,
  onChange,
}: {
  label: string;
  options: { valeur: string; label: string }[];
  valeurs: string[];
  onChange: (v: string[]) => void;
}) {
  const actif = valeurs.length > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 border-dashed", actif && "border-solid border-primary/40 bg-primary/5")}>
          {label}
          {actif && <span className="rounded bg-primary/15 px-1 text-xs text-primary">{valeurs.length}</span>}
          <ChevronDown className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-56">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.valeur}
            checked={valeurs.includes(o.valeur)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(c) => onChange(c ? [...valeurs, o.valeur] : valeurs.filter((v) => v !== o.valeur))}
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
        {actif && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])} className="justify-center text-xs">Effacer</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
