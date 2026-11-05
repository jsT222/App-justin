"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { chercherDoublons, creerHotel, majHotel, type HotelSaisie } from "@/lib/actions/hotels";
import { PRIORITES, TYPES_HOTEL } from "@/lib/constantes";
import type { Listes } from "@/lib/data";
import { valeurAnnuelle, valeurPonderee } from "@/lib/pipeline";
import type { Etape, Hotel } from "@/lib/types";
import { euros } from "@/lib/utils";
import { SaisieEtoiles } from "./etoiles";
import { MoisSelect } from "./mois-select";
import { TagsSelect } from "./tags-select";

const VIDE: HotelSaisie = {
  nom: "",
  ville: "",
  services: [],
  douleurs: [],
  mois_creux: [],
  mois_haute_saison: [],
  ouverture: "annuelle",
  priorite: "moyenne",
  montant_setup_estime: 0,
  montant_mensuel_estime: 0,
  probabilite: 5,
};

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{titre}</legend>
      {children}
    </fieldset>
  );
}

function Champ({ label, id, children, className }: { label: string; id?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const nombreOuNull = (v: string) => (v === "" ? null : Number(v));

export function HotelForm({
  ouvert,
  onOpenChange,
  hotel,
  etapes,
  listes,
  onEnregistre,
}: {
  ouvert: boolean;
  onOpenChange: (o: boolean) => void;
  hotel?: Hotel | null;
  etapes: Etape[];
  listes: Listes;
  onEnregistre?: (id: string) => void;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [f, setF] = useState<HotelSaisie>(hotel ?? { ...VIDE, etape_id: etapes[0]?.id });
  const [doublons, setDoublons] = useState<{ id: string; nom: string; ville: string | null }[]>([]);

  useEffect(() => {
    if (ouvert) {
      setF(hotel ?? { ...VIDE, etape_id: etapes[0]?.id });
      setDoublons([]);
    }
  }, [ouvert, hotel, etapes]);

  const set = <K extends keyof HotelSaisie>(k: K, v: HotelSaisie[K]) => setF((p) => ({ ...p, [k]: v }));

  const verifierDoublons = async () => {
    if (!f.nom?.trim()) return;
    setDoublons(await chercherDoublons(f.nom, f.ville ?? null, hotel?.id));
  };

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = hotel ? await majHotel(hotel.id, f) : await creerHotel(f);
      if (!r.ok) {
        toast.error(r.erreur);
        return;
      }
      toast.success(hotel ? "Fiche mise à jour" : "Prospect ajouté");
      onOpenChange(false);
      const id = hotel?.id ?? (r.data as { id: string } | undefined)?.id;
      if (id) onEnregistre?.(id);
      router.refresh();
    });
  };

  const changerEtape = (id: string) => {
    const etape = etapes.find((e) => e.id === id);
    setF((p) => ({ ...p, etape_id: id, probabilite: etape?.probabilite_defaut ?? p.probabilite }));
  };

  return (
    <Sheet open={ouvert} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>{hotel ? `Modifier ${hotel.nom}` : "Nouveau prospect"}</SheetTitle>
          <SheetDescription>Seul le nom est obligatoire. Tu pourras compléter plus tard.</SheetDescription>
        </SheetHeader>
        <form id="form-hotel" onSubmit={enregistrer} className="grid flex-1 gap-6 overflow-y-auto p-4">
          <Section titre="Hôtel">
            <div className="grid gap-3 sm:grid-cols-2">
              <Champ label="Nom *" id="h-nom">
                <Input id="h-nom" required autoFocus value={f.nom ?? ""} onChange={(e) => set("nom", e.target.value)} onBlur={verifierDoublons} />
              </Champ>
              <Champ label="Ville" id="h-ville">
                <Input id="h-ville" value={f.ville ?? ""} onChange={(e) => set("ville", e.target.value)} onBlur={verifierDoublons} />
              </Champ>
            </div>
            {doublons.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  Doublon possible :{" "}
                  {doublons.map((d, i) => (
                    <span key={d.id}>
                      {i > 0 && ", "}
                      <Link href={`/prospects/${d.id}`} className="font-medium underline" target="_blank">
                        {d.nom} ({d.ville ?? "ville inconnue"})
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_1fr]">
              <Champ label="Adresse" id="h-adresse">
                <Input id="h-adresse" value={f.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)} />
              </Champ>
              <Champ label="Code postal" id="h-cp">
                <Input id="h-cp" value={f.code_postal ?? ""} onChange={(e) => set("code_postal", e.target.value)} />
              </Champ>
              <Champ label="Département" id="h-dep">
                <Input id="h-dep" value={f.departement ?? ""} onChange={(e) => set("departement", e.target.value)} />
              </Champ>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Champ label="Site web" id="h-site">
                <Input id="h-site" value={f.site_web ?? ""} onChange={(e) => set("site_web", e.target.value)} placeholder="www.…" />
              </Champ>
              <Champ label="Page Booking" id="h-booking">
                <Input id="h-booking" value={f.url_booking ?? ""} onChange={(e) => set("url_booking", e.target.value)} />
              </Champ>
              <Champ label="Google Maps" id="h-maps">
                <Input id="h-maps" value={f.url_google_maps ?? ""} onChange={(e) => set("url_google_maps", e.target.value)} />
              </Champ>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Champ label="Catégorie">
                <SaisieEtoiles valeur={f.etoiles ?? null} onChange={(v) => set("etoiles", v)} />
              </Champ>
              <Champ label="Nombre de chambres" id="h-chambres">
                <Input id="h-chambres" type="number" min={0} value={f.nb_chambres ?? ""} onChange={(e) => set("nb_chambres", nombreOuNull(e.target.value))} />
              </Champ>
              <Champ label="Type">
                <Select value={f.type_hotel ?? ""} onValueChange={(v) => set("type_hotel", v as Hotel["type_hotel"])}>
                  <SelectTrigger aria-label="Type d'hôtel"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPES_HOTEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Champ>
            </div>
            <Champ label="Services">
              <TagsSelect valeurs={f.services ?? []} options={listes.service} onChange={(v) => set("services", v)} placeholder="Service" />
            </Champ>
          </Section>

          <Section titre="Saisonnalité">
            <div className="flex gap-2">
              {(["annuelle", "saisonniere"] as const).map((o) => (
                <Button key={o} type="button" size="sm" variant={f.ouverture === o ? "secondary" : "ghost"} onClick={() => set("ouverture", o)} aria-pressed={f.ouverture === o}>
                  {o === "annuelle" ? "Ouvert à l'année" : "Saisonnier"}
                </Button>
              ))}
            </div>
            <Champ label="Haute saison">
              <MoisSelect label="Mois de haute saison" valeurs={f.mois_haute_saison ?? []} onChange={(v) => set("mois_haute_saison", v)} />
            </Champ>
            <Champ label="Période creuse (le bon moment pour les contacter)">
              <MoisSelect label="Mois creux" couleur="amber" valeurs={f.mois_creux ?? []} onChange={(v) => set("mois_creux", v)} />
            </Champ>
          </Section>

          <Section titre="Réputation">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Champ label="Note Google (/5)" id="h-ng">
                <Input id="h-ng" type="number" step="0.1" min={0} max={5} value={f.note_google ?? ""} onChange={(e) => set("note_google", nombreOuNull(e.target.value))} />
              </Champ>
              <Champ label="Avis Google" id="h-nbg">
                <Input id="h-nbg" type="number" min={0} value={f.nb_avis_google ?? ""} onChange={(e) => set("nb_avis_google", nombreOuNull(e.target.value))} />
              </Champ>
              <Champ label="Note Booking (/10)" id="h-nb">
                <Input id="h-nb" type="number" step="0.1" min={0} max={10} value={f.note_booking ?? ""} onChange={(e) => set("note_booking", nombreOuNull(e.target.value))} />
              </Champ>
              <Champ label="Avis Booking" id="h-nbb">
                <Input id="h-nbb" type="number" min={0} value={f.nb_avis_booking ?? ""} onChange={(e) => set("nb_avis_booking", nombreOuNull(e.target.value))} />
              </Champ>
            </div>
          </Section>

          <Section titre="Stack technique">
            <div className="grid gap-3 sm:grid-cols-2">
              <Champ label="PMS">
                <Select value={f.pms ?? ""} onValueChange={(v) => set("pms", v)}>
                  <SelectTrigger aria-label="PMS"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...listes.pms, ...(f.pms ? [f.pms] : [])])).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Champ>
              <Champ label="Channel manager" id="h-cm">
                <Input id="h-cm" value={f.channel_manager ?? ""} onChange={(e) => set("channel_manager", e.target.value)} />
              </Champ>
              <Champ label="Moteur de réservation" id="h-moteur">
                <Input id="h-moteur" value={f.moteur_reservation ?? ""} onChange={(e) => set("moteur_reservation", e.target.value)} />
              </Champ>
              <Champ label="CRM" id="h-crm">
                <Input id="h-crm" value={f.crm ?? ""} onChange={(e) => set("crm", e.target.value)} />
              </Champ>
            </div>
          </Section>

          <Section titre="Commercial">
            <div className="grid gap-3 sm:grid-cols-3">
              <Champ label="Étape">
                <Select value={f.etape_id ?? ""} onValueChange={changerEtape}>
                  <SelectTrigger aria-label="Étape"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {etapes.map((e) => <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Champ>
              <Champ label="Source">
                <Select value={f.source ?? ""} onValueChange={(v) => set("source", v)}>
                  <SelectTrigger aria-label="Source"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...listes.source, ...(f.source ? [f.source] : [])])).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Champ>
              <Champ label="Priorité">
                <Select value={f.priorite ?? "moyenne"} onValueChange={(v) => set("priorite", v as Hotel["priorite"])}>
                  <SelectTrigger aria-label="Priorité"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Champ>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Champ label="Mise en place estimée (€)" id="h-setup">
                <Input id="h-setup" type="number" min={0} step={50} value={f.montant_setup_estime ?? 0} onChange={(e) => set("montant_setup_estime", Number(e.target.value))} />
              </Champ>
              <Champ label="Maintenance estimée (€/mois)" id="h-mensuel">
                <Input id="h-mensuel" type="number" min={0} step={10} value={f.montant_mensuel_estime ?? 0} onChange={(e) => set("montant_mensuel_estime", Number(e.target.value))} />
              </Champ>
              <Champ label="Probabilité (%)" id="h-proba">
                <Input id="h-proba" type="number" min={0} max={100} value={f.probabilite ?? 0} onChange={(e) => set("probabilite", Number(e.target.value))} />
              </Champ>
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur 1re année : <span className="font-medium text-foreground">{euros(valeurAnnuelle(f.montant_setup_estime ?? 0, f.montant_mensuel_estime ?? 0))}</span>
              {" · "}pondérée : <span className="font-medium text-foreground">{euros(valeurPonderee(f.montant_setup_estime ?? 0, f.montant_mensuel_estime ?? 0, f.probabilite ?? 0))}</span>
            </p>
            <Champ label="Douleurs identifiées">
              <TagsSelect valeurs={f.douleurs ?? []} options={listes.douleur} onChange={(v) => set("douleurs", v)} placeholder="Douleur" />
            </Champ>
          </Section>
        </form>
        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="submit" form="form-hotel" disabled={enCours}>
            {enCours && <Loader2 className="animate-spin" />}
            {hotel ? "Enregistrer" : "Ajouter le prospect"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
