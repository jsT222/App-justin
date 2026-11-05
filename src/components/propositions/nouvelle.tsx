"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageEntete } from "@/components/layout/page-entete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { creerProposition } from "@/lib/actions/propositions";
import { totauxProposition } from "@/lib/calculs/proposition";
import type { Offre } from "@/lib/types";
import { euros } from "@/lib/utils";

const recommandees = (offres: Offre[], douleurs: string[]) => offres.filter((o) => o.douleurs_associees.some((d) => douleurs.includes(d))).map((o) => o.id);

export function NouvelleProposition({ hotels, offres, hotelInitial }: { hotels: { id: string; nom: string; ville: string | null; douleurs: string[] }[]; offres: Offre[]; hotelInitial?: string }) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [hotelId, setHotelId] = useState(hotelInitial ?? "");
  const hotel = hotels.find((h) => h.id === hotelId);
  const [choix, setChoix] = useState<string[]>(() => recommandees(offres, hotel?.douleurs ?? []));
  const [titre, setTitre] = useState("");
  const t = totauxProposition(offres.filter((o) => choix.includes(o.id)).map((o) => ({ quantite: 1, prix_setup: o.prix_setup_indicatif, prix_mensuel: o.prix_mensuel_indicatif })), 0);

  const choisirHotel = (id: string) => {
    setHotelId(id);
    setChoix(recommandees(offres, hotels.find((h) => h.id === id)?.douleurs ?? []));
  };

  const creer = () =>
    startTransition(async () => {
      const r = await creerProposition(hotelId, choix, titre);
      if (!r.ok) return void toast.error(r.erreur);
      router.push(`/propositions/${r.data!.id}`);
    });

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4">
      <PageEntete titre="Nouvelle proposition" description="Choisis l'hôtel et les offres : tu ajusteras les prix ensuite." />
      <Card>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Hôtel</Label>
            <Select value={hotelId} onValueChange={choisirHotel}>
              <SelectTrigger aria-label="Hôtel"><SelectValue placeholder="Choisir un hôtel…" /></SelectTrigger>
              <SelectContent>{hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.nom}{h.ville ? ` — ${h.ville}` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-titre">Titre</Label>
            <Input id="p-titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Proposition d'automatisation" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Offres</CardTitle></CardHeader>
        <CardContent className="grid gap-1">
          {offres.map((o) => {
            const reco = hotel && o.douleurs_associees.some((d) => hotel.douleurs.includes(d));
            return (
              <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-accent/50">
                <Checkbox checked={choix.includes(o.id)} onCheckedChange={(c) => setChoix((p) => (c ? [...p, o.id] : p.filter((x) => x !== o.id)))} aria-label={o.nom} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium">{o.nom} {reco && <Sparkles className="size-3.5 text-primary" aria-label="Recommandée" />}</p>
                  <p className="text-xs text-muted-foreground">{o.gain_estime}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums">{euros(o.prix_setup_indicatif)} <span className="text-muted-foreground">+ {euros(o.prix_mensuel_indicatif)}/m</span></span>
              </label>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground">Total : <span className="font-medium text-foreground">{euros(t.setup)}</span> + {euros(t.mensuel)}/mois</span>
        <Button disabled={!hotelId || enCours} onClick={creer}>{enCours && <Loader2 className="animate-spin" />}Créer la proposition</Button>
      </div>
    </div>
  );
}
