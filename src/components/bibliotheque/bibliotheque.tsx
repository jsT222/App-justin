"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Copy, Loader2, MoreHorizontal, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { TagsSelect } from "@/components/hotel/tags-select";
import { PageEntete } from "@/components/layout/page-entete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { enregistrerModele, enregistrerOffre, supprimerModele, supprimerOffre } from "@/lib/actions/bibliotheque";
import { CANAUX_MODELE } from "@/lib/constantes";
import { remplirModele, VARIABLES } from "@/lib/modeles";
import type { CanalModele, ModeleMessage, Offre } from "@/lib/types";
import { cn, euros } from "@/lib/utils";

interface HotelVar { id: string; nom: string; ville: string | null; etoiles: number | null; nb_chambres: number | null; prenom: string | null }
const AUCUN = "__aucun__";

export function BoutonCopier({ texte, label = "Copier" }: { texte: string; label?: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <Button
      size="xs"
      variant={copie ? "secondary" : "outline"}
      onClick={async () => {
        await navigator.clipboard.writeText(texte);
        setCopie(true);
        toast.success("Copié dans le presse-papiers");
        setTimeout(() => setCopie(false), 1500);
      }}
    >
      {copie ? <Check /> : <Copy />} {copie ? "Copié" : label}
    </Button>
  );
}

export function Bibliotheque({
  onglet,
  offres,
  modeles,
  hotels,
  hotelInitial,
  douleurs,
}: {
  onglet: "offres" | "modeles";
  offres: Offre[];
  modeles: ModeleMessage[];
  hotels: HotelVar[];
  hotelInitial?: string;
  douleurs: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [hotelId, setHotelId] = useState(hotelInitial ?? AUCUN);
  const [editOffre, setEditOffre] = useState<Partial<Offre> | null>(null);
  const [editModele, setEditModele] = useState<Partial<ModeleMessage> | null>(null);
  const hotel = hotels.find((h) => h.id === hotelId);
  const vars = useMemo(
    () => (hotel ? { nom_hotel: hotel.nom, ville: hotel.ville, etoiles: hotel.etoiles, nb_chambres: hotel.nb_chambres, prenom: hotel.prenom } : {}),
    [hotel],
  );

  const agir = (fn: () => Promise<{ ok: boolean; erreur?: string }>, msg: string) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.erreur);
      toast.success(msg);
      router.refresh();
    });

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageEntete titre="Bibliothèque" description="Tes offres prêtes à proposer et tes modèles de messages." />
      <Tabs defaultValue={onglet}>
        <TabsList>
          <TabsTrigger value="offres">Offres ({offres.length})</TabsTrigger>
          <TabsTrigger value="modeles">Modèles de messages ({modeles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="offres" className="grid gap-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setEditOffre({ actif: true, douleurs_associees: [], prix_setup_indicatif: 0, prix_mensuel_indicatif: 0, ordre: offres.length + 1 })}>
              <Plus /> Nouvelle offre
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offres.map((o) => (
              <Card key={o.id} className={cn("gap-3", !o.actif && "opacity-60")}>
                <CardHeader>
                  <CardDescription className="text-xs">{o.categorie}</CardDescription>
                  <CardTitle className="text-base leading-snug">{o.nom}</CardTitle>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-xs" aria-label={`Actions ${o.nom}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditOffre(o)}><Pencil /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => agir(() => enregistrerOffre({ actif: !o.actif }, o.id), o.actif ? "Offre désactivée" : "Offre activée")}>
                          {o.actif ? "Désactiver" : "Activer"}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => agir(() => supprimerOffre(o.id), "Offre supprimée")}><Trash2 /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <p className="text-muted-foreground">{o.description}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold tabular-nums">{euros(o.prix_setup_indicatif)}</span>
                    <span className="text-muted-foreground">+ {euros(o.prix_mensuel_indicatif)}/mois</span>
                  </div>
                  {o.gain_estime && <p className="flex gap-1.5 text-xs"><TrendingUp className="size-3.5 shrink-0 text-success" />{o.gain_estime}</p>}
                  {o.duree_mise_en_place && <p className="flex gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5 shrink-0" />{o.duree_mise_en_place}</p>}
                  {o.douleurs_associees.length > 0 && (
                    <div className="flex flex-wrap gap-1">{o.douleurs_associees.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modeles" className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Remplir les variables avec</Label>
              <Select value={hotelId} onValueChange={setHotelId}>
                <SelectTrigger className="w-72" aria-label="Hôtel pour les variables"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUCUN}>— Aucun hôtel (variables brutes) —</SelectItem>
                  {hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.nom}{h.ville ? ` — ${h.ville}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={() => setEditModele({ canal: "linkedin_message", ordre: modeles.length + 1 })}><Plus /> Nouveau modèle</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {modeles.map((m) => {
              const objet = remplirModele(m.objet, vars);
              const contenu = remplirModele(m.contenu, vars);
              return (
                <Card key={m.id} className="gap-3" data-modele={m.titre}>
                  <CardHeader>
                    <CardDescription className="text-xs">{CANAUX_MODELE[m.canal]}</CardDescription>
                    <CardTitle>{m.titre}</CardTitle>
                    <CardAction className="flex items-center gap-1">
                      <BoutonCopier texte={objet ? `${objet}\n\n${contenu}` : contenu} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-xs" aria-label={`Actions ${m.titre}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditModele(m)}><Pencil /> Modifier</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => agir(() => supprimerModele(m.id), "Modèle supprimé")}><Trash2 /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {objet && <p className="text-sm"><span className="text-muted-foreground">Objet : </span>{objet}</p>}
                    <pre className="max-h-64 overflow-y-auto rounded-md bg-muted/50 p-3 font-sans text-sm whitespace-pre-wrap" data-contenu>{contenu}</pre>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <OffreDialog offre={editOffre} douleurs={douleurs} onClose={() => setEditOffre(null)} />
      <ModeleDialog modele={editModele} onClose={() => setEditModele(null)} />
    </div>
  );
}

function OffreDialog({ offre, douleurs, onClose }: { offre: Partial<Offre> | null; douleurs: string[]; onClose: () => void }) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [f, setF] = useState<Partial<Offre>>({});
  const [cle, setCle] = useState<object | null>(null);
  if (offre && cle !== offre) { setCle(offre); setF(offre); }
  const set = <K extends keyof Offre>(k: K, v: Offre[K]) => setF((p) => ({ ...p, [k]: v }));
  const valider = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await enregistrerOffre(f, offre?.id);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success("Offre enregistrée");
      onClose();
      router.refresh();
    });
  };
  return (
    <Dialog open={!!offre} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{offre?.id ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle></DialogHeader>
        <form id="form-offre" onSubmit={valider} className="grid gap-3">
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <div className="grid gap-1.5"><Label htmlFor="o-nom">Nom</Label><Input id="o-nom" required value={f.nom ?? ""} onChange={(e) => set("nom", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="o-cat">Catégorie</Label><Input id="o-cat" value={f.categorie ?? ""} onChange={(e) => set("categorie", e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="o-desc">Description</Label><Textarea id="o-desc" value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="o-setup">Mise en place (€)</Label><Input id="o-setup" type="number" min={0} value={f.prix_setup_indicatif ?? 0} onChange={(e) => set("prix_setup_indicatif", Number(e.target.value))} /></div>
            <div className="grid gap-1.5"><Label htmlFor="o-mensuel">Maintenance (€/mois)</Label><Input id="o-mensuel" type="number" min={0} value={f.prix_mensuel_indicatif ?? 0} onChange={(e) => set("prix_mensuel_indicatif", Number(e.target.value))} /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="o-gain">Gain estimé</Label><Input id="o-gain" value={f.gain_estime ?? ""} onChange={(e) => set("gain_estime", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="o-duree">Durée de mise en place</Label><Input id="o-duree" value={f.duree_mise_en_place ?? ""} onChange={(e) => set("duree_mise_en_place", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Douleurs résolues (sert aux recommandations)</Label><TagsSelect valeurs={f.douleurs_associees ?? []} options={douleurs} onChange={(v) => set("douleurs_associees", v)} placeholder="Douleur" /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.actif ?? true} onCheckedChange={(c) => set("actif", c)} /> Offre active</label>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="form-offre" disabled={enCours}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeleDialog({ modele, onClose }: { modele: Partial<ModeleMessage> | null; onClose: () => void }) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [f, setF] = useState<Partial<ModeleMessage>>({});
  const [cle, setCle] = useState<object | null>(null);
  if (modele && cle !== modele) { setCle(modele); setF(modele); }
  const set = <K extends keyof ModeleMessage>(k: K, v: ModeleMessage[K]) => setF((p) => ({ ...p, [k]: v }));
  const valider = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await enregistrerModele(f, modele?.id);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success("Modèle enregistré");
      onClose();
      router.refresh();
    });
  };
  return (
    <Dialog open={!!modele} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{modele?.id ? "Modifier le modèle" : "Nouveau modèle"}</DialogTitle></DialogHeader>
        <form id="form-modele" onSubmit={valider} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="m-titre">Titre</Label><Input id="m-titre" required value={f.titre ?? ""} onChange={(e) => set("titre", e.target.value)} /></div>
            <div className="grid gap-1.5">
              <Label>Canal</Label>
              <Select value={f.canal} onValueChange={(v) => set("canal", v as CanalModele)}>
                <SelectTrigger aria-label="Canal"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CANAUX_MODELE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {f.canal?.startsWith("email") && <div className="grid gap-1.5"><Label htmlFor="m-objet">Objet</Label><Input id="m-objet" value={f.objet ?? ""} onChange={(e) => set("objet", e.target.value)} /></div>}
          <div className="grid gap-1.5">
            <Label htmlFor="m-contenu">Contenu</Label>
            <Textarea id="m-contenu" required className="min-h-48" value={f.contenu ?? ""} onChange={(e) => set("contenu", e.target.value)} />
            <p className="text-xs text-muted-foreground">Variables : {VARIABLES.map((v) => `{${v}}`).join(" ")}</p>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="form-modele" disabled={enCours}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
