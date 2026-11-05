"use client";

import { useState } from "react";
import { addMonths, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RAISONS_PERTE } from "@/lib/constantes";
import type { RaisonPerte } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface InfosPerte {
  raison: RaisonPerte;
  detail: string;
  dateRecontact: string | null;
}

export function DialogPerdu({
  ouvert,
  nomHotel,
  onAnnuler,
  onValider,
}: {
  ouvert: boolean;
  nomHotel: string;
  onAnnuler: () => void;
  onValider: (infos: InfosPerte) => void;
}) {
  const [raison, setRaison] = useState<RaisonPerte | null>(null);
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState(format(addMonths(new Date(), 6), "yyyy-MM-dd"));
  const [recontacter, setRecontacter] = useState(true);

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marquer « {nomHotel} » comme perdu</DialogTitle>
          <DialogDescription>Pourquoi l&apos;affaire est perdue ? Ça aide à ajuster ton offre.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Raison de la perte">
            {(Object.entries(RAISONS_PERTE) as [RaisonPerte, string][]).map(([k, v]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={raison === k}
                onClick={() => setRaison(k)}
                className={cn("h-9 rounded-md border text-sm transition-colors", raison === k ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent")}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="detail-perte">Détail (optionnel)</Label>
            <Textarea id="detail-perte" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ce qu'a dit le prospect…" />
          </div>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={recontacter} onChange={(e) => setRecontacter(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Recontacter plus tard
            </label>
            {recontacter && <Input type="date" aria-label="Date de recontact" value={date} onChange={(e) => setDate(e.target.value)} />}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onAnnuler}>Annuler</Button>
          <Button
            variant="destructive"
            disabled={!raison}
            onClick={() => raison && onValider({ raison, detail, dateRecontact: recontacter ? date : null })}
          >
            Marquer comme perdu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
