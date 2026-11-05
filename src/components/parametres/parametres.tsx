"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Database, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { definirObjectifs } from "@/lib/actions/objectifs";
import { ajouterValeur, chargerDemo, enregistrerEtapes, majProfil, supprimerEtape, supprimerValeur, televerserLogo } from "@/lib/actions/parametres";
import { COULEURS_ETAPE, METRIQUES } from "@/lib/constantes";
import type { CategorieListe, Etape, ListeValeur, MetriqueObjectif, Profil } from "@/lib/types";
import { cn } from "@/lib/utils";

type R = { ok: boolean; erreur?: string };
function useAction() {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const agir = (fn: () => Promise<R>, msg: string, apres?: () => void) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.erreur);
      toast.success(msg);
      apres?.();
      router.refresh();
    });
  return { enCours, agir };
}

export function Parametres({ profil, etapes, listes, objectifs, nbHotels }: { profil: Profil; etapes: Etape[]; listes: ListeValeur[]; objectifs: Record<MetriqueObjectif, number>; nbHotels: number }) {
  return (
    <Tabs defaultValue="profil">
      <TabsList className="flex-wrap">
        <TabsTrigger value="profil">Mes infos</TabsTrigger>
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="listes">Sources et tags</TabsTrigger>
        <TabsTrigger value="objectifs">Objectifs</TabsTrigger>
        <TabsTrigger value="donnees">Données</TabsTrigger>
      </TabsList>
      <TabsContent value="profil"><ProfilForm profil={profil} /></TabsContent>
      <TabsContent value="pipeline"><EtapesForm etapes={etapes} /></TabsContent>
      <TabsContent value="listes" className="grid gap-5 md:grid-cols-2">
        <ListeEditeur titre="Sources" categorie="source" valeurs={listes.filter((l) => l.categorie === "source")} />
        <ListeEditeur titre="Douleurs (tags)" categorie="douleur" valeurs={listes.filter((l) => l.categorie === "douleur")} />
        <ListeEditeur titre="Services hôteliers" categorie="service" valeurs={listes.filter((l) => l.categorie === "service")} />
        <ListeEditeur titre="PMS" categorie="pms" valeurs={listes.filter((l) => l.categorie === "pms")} />
      </TabsContent>
      <TabsContent value="objectifs"><ObjectifsDefaut objectifs={objectifs} /></TabsContent>
      <TabsContent value="donnees"><Donnees nbHotels={nbHotels} /></TabsContent>
    </Tabs>
  );
}

function ProfilForm({ profil }: { profil: Profil }) {
  const { enCours, agir } = useAction();
  const [f, setF] = useState(profil);
  const [logoEnCours, startLogo] = useTransition();
  const router = useRouter();
  const set = (k: keyof Profil, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const champ = (k: keyof Profil, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="grid gap-1.5"><Label htmlFor={`pr-${k}`}>{label}</Label><Input id={`pr-${k}`} value={(f[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} {...props} /></div>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations affichées sur tes propositions</CardTitle>
        <CardDescription>Nom, SIRET, coordonnées et logo apparaissent dans l&apos;en-tête et le pied du PDF.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-md border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {f.logo_url ? <img src={f.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">Pas de logo</span>}
          </div>
          <label className="inline-flex">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              aria-label="Téléverser un logo"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("logo", file);
                startLogo(async () => {
                  const r = await televerserLogo(fd);
                  if (!r.ok) return void toast.error(r.erreur);
                  setF((p) => ({ ...p, logo_url: r.url ?? p.logo_url }));
                  toast.success("Logo mis à jour");
                  router.refresh();
                });
              }}
            />
            <span className={cn("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-accent", logoEnCours && "opacity-50")}>
              {logoEnCours ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Changer le logo
            </span>
          </label>
          {f.logo_url && <Button variant="ghost" size="sm" onClick={() => setF((p) => ({ ...p, logo_url: null }))}><X /> Retirer</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {champ("nom_complet", "Nom complet")}
          {champ("raison_sociale", "Raison sociale / nom commercial")}
          {champ("siret", "SIRET")}
          {champ("email", "Email", { type: "email" })}
          {champ("telephone", "Téléphone")}
          {champ("site_web", "Site web")}
        </div>
        {champ("adresse", "Adresse")}
        <div className="grid gap-3 sm:grid-cols-2">
          {champ("mention_tva", "Mention TVA")}
          {champ("iban", "IBAN (optionnel)")}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
          <div className="grid gap-1.5"><Label htmlFor="pr-cond">Conditions de paiement par défaut</Label><Textarea id="pr-cond" value={f.conditions_paiement ?? ""} onChange={(e) => set("conditions_paiement", e.target.value)} /></div>
          {champ("validite_devis_jours", "Validité des devis (jours)", { type: "number", min: 1 })}
        </div>
        <Button className="w-fit" disabled={enCours} onClick={() => agir(() => majProfil(f), "Informations enregistrées")}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
      </CardContent>
    </Card>
  );
}

function EtapesForm({ etapes: init }: { etapes: Etape[] }) {
  const { enCours, agir } = useAction();
  const [etapes, setEtapes] = useState<(Etape | (Omit<Etape, "id"> & { id?: string }))[]>(init);
  const deplacer = (i: number, d: -1 | 1) => setEtapes((es) => { const c = [...es]; [c[i], c[i + d]] = [c[i + d], c[i]]; return c; });
  const maj = (i: number, k: "nom" | "couleur" | "probabilite_defaut", v: string | number) => setEtapes((es) => es.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Étapes du pipeline</CardTitle>
        <CardDescription>Renomme, réordonne, ajoute des étapes. Les étapes de base gardent leurs automatismes (séquences, client, perte) même renommées.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {etapes.map((e, i) => (
          <div key={e.id ?? `n${i}`} className="flex flex-wrap items-center gap-2 rounded-md border p-2" data-etape-param={e.nom}>
            <div className="flex flex-col">
              <Button variant="ghost" size="icon-xs" aria-label="Monter" disabled={i === 0} onClick={() => deplacer(i, -1)}><ArrowUp /></Button>
              <Button variant="ghost" size="icon-xs" aria-label="Descendre" disabled={i === etapes.length - 1} onClick={() => deplacer(i, 1)}><ArrowDown /></Button>
            </div>
            <Select value={e.couleur} onValueChange={(v) => maj(i, "couleur", v)}>
              <SelectTrigger className="w-16" aria-label="Couleur"><span className={cn("size-3 rounded-full", COULEURS_ETAPE[e.couleur]?.pastille)} /></SelectTrigger>
              <SelectContent>{Object.entries(COULEURS_ETAPE).map(([k, c]) => <SelectItem key={k} value={k}><span className={cn("size-3 rounded-full", c.pastille)} /> {k}</SelectItem>)}</SelectContent>
            </Select>
            <Input aria-label="Nom de l'étape" className="min-w-40 flex-1" value={e.nom} onChange={(ev) => maj(i, "nom", ev.target.value)} />
            <div className="flex items-center gap-1"><Input aria-label="Probabilité par défaut" type="number" min={0} max={100} className="w-20 text-right" value={e.probabilite_defaut} onChange={(ev) => maj(i, "probabilite_defaut", Number(ev.target.value))} /><span className="text-sm text-muted-foreground">%</span></div>
            {e.code ? <Badge variant="secondary" className="w-16 justify-center">base</Badge> : (
              <Button variant="ghost" size="icon-sm" aria-label="Supprimer l'étape" onClick={() => (e.id ? agir(() => supprimerEtape(e.id!), "Étape supprimée", () => setEtapes((es) => es.filter((x) => x !== e))) : setEtapes((es) => es.filter((x) => x !== e)))}><Trash2 /></Button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEtapes((es) => [...es.slice(0, -2), { nom: "Nouvelle étape", code: null, couleur: "cyan", probabilite_defaut: 30, ordre: 0 }, ...es.slice(-2)])}><Plus /> Ajouter une étape</Button>
          <Button size="sm" disabled={enCours} onClick={() => agir(() => enregistrerEtapes(etapes.map((e, i) => ({ ...e, ordre: i + 1 }))), "Pipeline enregistré")}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ListeEditeur({ titre, categorie, valeurs }: { titre: string; categorie: CategorieListe; valeurs: ListeValeur[] }) {
  const { enCours, agir } = useAction();
  const [nouvelle, setNouvelle] = useState("");
  return (
    <Card>
      <CardHeader><CardTitle>{titre}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-1.5">
          {valeurs.map((v) => (
            <Badge key={v.id} variant="secondary" className="gap-1 pr-1">
              {v.valeur}
              <button aria-label={`Supprimer ${v.valeur}`} onClick={() => agir(() => supprimerValeur(v.id), "Supprimé")} className="opacity-60 hover:opacity-100"><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); agir(() => ajouterValeur(categorie, nouvelle), "Ajouté", () => setNouvelle("")); }}>
          <Input aria-label={`Ajouter : ${titre}`} value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="Ajouter…" className="h-8" />
          <Button size="sm" type="submit" variant="outline" disabled={enCours || !nouvelle.trim()}><Plus /></Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ObjectifsDefaut({ objectifs }: { objectifs: Record<MetriqueObjectif, number> }) {
  const { enCours, agir } = useAction();
  const [v, setV] = useState(objectifs);
  const ligne = (m: MetriqueObjectif, suffixe: string) => (
    <div key={m} className="grid grid-cols-[1fr_140px] items-center gap-3">
      <Label htmlFor={`obj-${m}`}>{METRIQUES[m]} <span className="font-normal text-muted-foreground">{suffixe}</span></Label>
      <Input id={`obj-${m}`} type="number" min={0} className="text-right" value={v[m]} onChange={(e) => setV((x) => ({ ...x, [m]: Number(e.target.value) }))} />
    </div>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objectifs par défaut</CardTitle>
        <CardDescription>Utilisés chaque mois, sauf si tu ajustes un mois précis depuis la page Objectifs.</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-lg gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Par jour</p>
        {ligne("linkedin", "")}{ligne("appels", "")}{ligne("emails", "")}
        <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Par mois</p>
        {ligne("rdv", "")}{ligne("signatures", "")}{ligne("ca", "(€)")}
        <Button className="mt-2 w-fit" disabled={enCours} onClick={() => agir(() => definirObjectifs(v, null), "Objectifs enregistrés")}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
      </CardContent>
    </Card>
  );
}

function Donnees({ nbHotels }: { nbHotels: number }) {
  const { enCours, agir } = useAction();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Données de démo</CardTitle>
        <CardDescription>20 hôtels fictifs de la Côte d&apos;Azur et du Var, 3 clients, relances, propositions et historique d&apos;activité.</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline" disabled={enCours}>{enCours ? <Loader2 className="animate-spin" /> : <Database />} Charger les données de démo</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remplacer tes données par la démo ?</AlertDialogTitle>
              <AlertDialogDescription>
                {nbHotels > 0 ? `Tes ${nbHotels} hôtel(s), avec leurs contacts, notes, relances, propositions et clients, seront supprimés.` : "La démo sera chargée."}{" "}
                Tes offres, modèles, paramètres et objectifs sont conservés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => agir(chargerDemo, "Données de démo chargées")}>Charger la démo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
