"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, setHours, setMinutes, startOfHour } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enregistrerRelance } from "@/lib/actions/hotels";
import { TYPES_RELANCE } from "@/lib/constantes";
import { versInputDateHeure } from "@/lib/dates";
import type { Relance, TypeRelance } from "@/lib/types";

export interface HotelOption { id: string; nom: string; ville?: string | null }

const RACCOURCIS_DATE = [
  { label: "Demain", jours: 1 },
  { label: "J+3", jours: 3 },
  { label: "J+7", jours: 7 },
  { label: "J+14", jours: 14 },
];

const defautDate = (jours = 1) => setMinutes(setHours(startOfHour(addDays(new Date(), jours)), 9), 0);

/** Création / modification d'une relance ou d'un RDV. */
export function RelanceDialog({
  ouvert,
  onOpenChange,
  hotelId,
  hotels,
  relance,
  typeInitial = "appel",
}: {
  ouvert: boolean;
  onOpenChange: (o: boolean) => void;
  hotelId?: string;
  hotels?: HotelOption[];
  relance?: Relance | null;
  typeInitial?: TypeRelance;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [hotel, setHotel] = useState(hotelId ?? "");
  const [type, setType] = useState<TypeRelance>(typeInitial);
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState(versInputDateHeure(defautDate()));
  const [duree, setDuree] = useState("45");
  const [lieu, setLieu] = useState("");

  useEffect(() => {
    if (!ouvert) return;
    setHotel(relance?.hotel_id ?? hotelId ?? "");
    setType(relance?.type ?? typeInitial);
    setTitre(relance?.titre ?? "");
    setDate(versInputDateHeure(relance?.date_prevue ?? defautDate()));
    setDuree(String(relance?.duree_min ?? 45));
    setLieu(relance?.lieu_ou_lien ?? "");
  }, [ouvert, relance, hotelId, typeInitial]);

  const titreDefaut = () => {
    const nom = hotels?.find((h) => h.id === hotel)?.nom;
    return `${type === "rdv" ? "RDV" : TYPES_RELANCE[type]}${nom ? ` — ${nom}` : ""}`;
  };

  const valider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotel) return toast.error("Choisis un hôtel.");
    startTransition(async () => {
      const r = await enregistrerRelance(
        {
          hotel_id: hotel,
          type,
          titre: titre.trim() || titreDefaut(),
          date_prevue: new Date(date).toISOString(),
          duree_min: type === "rdv" ? Number(duree) || null : null,
          lieu_ou_lien: type === "rdv" ? lieu : null,
        },
        relance?.id,
      );
      if (!r.ok) return void toast.error(r.erreur);
      toast.success(type === "rdv" ? "RDV enregistré" : "Relance planifiée");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{relance ? "Modifier" : type === "rdv" ? "Nouveau rendez-vous" : "Nouvelle relance"}</DialogTitle>
          <DialogDescription>Elle apparaîtra dans l&apos;agenda et dans « Relances du jour ».</DialogDescription>
        </DialogHeader>
        <form id="form-relance" onSubmit={valider} className="grid gap-4">
          {!hotelId && hotels && (
            <div className="grid gap-1.5">
              <Label>Hôtel</Label>
              <Select value={hotel} onValueChange={setHotel}>
                <SelectTrigger aria-label="Hôtel"><SelectValue placeholder="Choisir un hôtel…" /></SelectTrigger>
                <SelectContent>
                  {hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.nom}{h.ville ? ` — ${h.ville}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Type">
            {(Object.entries(TYPES_RELANCE) as [TypeRelance, string][]).map(([k, v]) => (
              <Button key={k} type="button" size="sm" role="radio" aria-checked={type === k} variant={type === k ? "secondary" : "ghost"} onClick={() => setType(k)}>
                {v}
              </Button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="r-titre">Titre</Label>
            <Input id="r-titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={titreDefaut()} autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="r-date">Date et heure</Label>
            <Input id="r-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
            <div className="flex gap-1.5">
              {RACCOURCIS_DATE.map((r) => (
                <Button key={r.label} type="button" variant="outline" size="xs" onClick={() => setDate(versInputDateHeure(defautDate(r.jours)))}>
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
          {type === "rdv" && (
            <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
              <div className="grid gap-1.5">
                <Label htmlFor="r-duree">Durée (min)</Label>
                <Input id="r-duree" type="number" min={5} step={5} value={duree} onChange={(e) => setDuree(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-lieu">Lieu ou lien visio</Label>
                <Input id="r-lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Sur place / https://meet…" />
              </div>
            </div>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="submit" form="form-relance" disabled={enCours}>
            {enCours && <Loader2 className="animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const formatDateCourt = (d: Date) => format(d, "yyyy-MM-dd");
