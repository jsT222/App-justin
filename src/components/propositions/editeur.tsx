"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Download, GripVertical, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { changerStatutProposition, enregistrerProposition, supprimerProposition, type LigneSaisie } from "@/lib/actions/propositions";
import { totauxProposition } from "@/lib/calculs/proposition";
import { STATUTS_PROPOSITION } from "@/lib/constantes";
import type { LigneProposition, Offre, Proposition, StatutProposition } from "@/lib/types";
import { euros } from "@/lib/utils";
import { variantStatut } from "./liste";

export function EditeurProposition({
  proposition: p,
  lignes: lignesInit,
  offres,
}: {
  proposition: Proposition & { hotels: { id: string; nom: string; ville: string | null } };
  lignes: LigneProposition[];
  offres: Offre[];
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [f, setF] = useState({
    titre: p.titre,
    introduction: p.introduction,
    conditions: p.conditions,
    remise_pct: p.remise_pct,
    date_envoi: p.date_envoi,
    date_validite: p.date_validite,
  });
  const [lignes, setLignes] = useState<LigneSaisie[]>(lignesInit);
  const [modifie, setModifie] = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState(false);
  const t = totauxProposition(lignes, f.remise_pct);
  const verrouillee = p.statut === "acceptee";

  const setChamp = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setModifie(true); };
  const setLigne = (i: number, maj: Partial<LigneSaisie>) => { setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, ...maj } : l))); setModifie(true); };
  const ajouterOffre = (o?: Offre) => {
    setLignes((ls) => [...ls, o
      ? { offre_id: o.id, libelle: o.nom, description: o.description, quantite: 1, prix_setup: o.prix_setup_indicatif, prix_mensuel: o.prix_mensuel_indicatif }
      : { offre_id: null, libelle: "", description: "", quantite: 1, prix_setup: 0, prix_mensuel: 0 }]);
    setModifie(true);
  };

  const enregistrer = (ensuite?: () => Promise<void>) =>
    startTransition(async () => {
      const r = await enregistrerProposition(p.id, f, lignes);
      if (!r.ok) return void toast.error(r.erreur);
      setModifie(false);
      if (ensuite) await ensuite();
      else toast.success("Proposition enregistrée");
      router.refresh();
    });

  const changerStatut = (s: StatutProposition) =>
    enregistrer(async () => {
      const r = await changerStatutProposition(p.id, s);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success(
        s === "acceptee" ? "Proposition acceptée ! Client et automatisations créés." : `Statut : ${STATUTS_PROPOSITION[s]}`,
        s === "acceptee" ? { action: { label: "Voir les clients", onClick: () => router.push("/clients") } } : undefined,
      );
    });

  const telecharger = () => {
    if (modifie) enregistrer(async () => { window.open(`/api/propositions/${p.id}/pdf`, "_blank"); });
    else window.open(`/api/propositions/${p.id}/pdf`, "_blank");
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid gap-3">
        <Link href="/propositions" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Propositions</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{p.numero}</h1>
              <Badge variant={variantStatut(p.statut)}>{STATUTS_PROPOSITION[p.statut]}</Badge>
            </div>
            <Link href={`/prospects/${p.hotels.id}`} className="text-sm text-muted-foreground hover:underline">{p.hotels.nom}{p.hotels.ville ? ` — ${p.hotels.ville}` : ""}</Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={telecharger}><Download /> PDF</Button>
            {p.statut === "brouillon" && <Button size="sm" variant="secondary" onClick={() => changerStatut("envoyee")}><Send /> Marquer envoyée</Button>}
            {(p.statut === "envoyee" || p.statut === "brouillon") && (
              <>
                <Button size="sm" variant="outline" className="text-success" onClick={() => changerStatut("acceptee")}><Check /> Acceptée</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => changerStatut("refusee")}><X /> Refusée</Button>
              </>
            )}
            {p.statut === "refusee" && <Button size="sm" variant="outline" onClick={() => changerStatut("brouillon")}>Repasser en brouillon</Button>}
            <Button size="sm" disabled={!modifie || enCours} onClick={() => enregistrer()}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
            <Button size="icon-sm" variant="ghost" aria-label="Supprimer la proposition" onClick={() => setConfirmSuppr(true)}><Trash2 /></Button>
          </div>
        </div>
        {verrouillee && <p className="text-sm text-muted-foreground">Proposition acceptée : les modifications ne changent plus les automatisations du client (à gérer depuis la fiche client).</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid grid-cols-1 content-start gap-5">
          <Card>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5"><Label htmlFor="p-titre">Titre</Label><Input id="p-titre" value={f.titre} onChange={(e) => setChamp("titre", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="p-intro">Introduction</Label><Textarea id="p-intro" value={f.introduction ?? ""} onChange={(e) => setChamp("introduction", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prestations</CardTitle>
              <CardAction className="flex gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="xs" variant="outline"><Plus /> Depuis la bibliothèque</Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    {offres.map((o) => <DropdownMenuItem key={o.id} onSelect={() => ajouterOffre(o)}>{o.nom}</DropdownMenuItem>)}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => ajouterOffre()}>Ligne libre</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3">
              {lignes.length === 0 && <p className="text-sm text-muted-foreground">Ajoute une prestation depuis la bibliothèque.</p>}
              {lignes.map((l, i) => (
                <div key={l.id ?? `n${i}`} className="grid gap-2 rounded-lg border p-3" data-ligne={i}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                    <Input aria-label="Libellé" value={l.libelle} onChange={(e) => setLigne(i, { libelle: e.target.value })} className="font-medium" placeholder="Prestation" />
                    <Button variant="ghost" size="icon-sm" aria-label="Retirer la ligne" onClick={() => { setLignes((ls) => ls.filter((_, j) => j !== i)); setModifie(true); }}><Trash2 /></Button>
                  </div>
                  <Textarea aria-label="Description" value={l.description ?? ""} onChange={(e) => setLigne(i, { description: e.target.value })} className="min-h-12 text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Quantité</Label><Input aria-label="Quantité" type="number" min={1} value={l.quantite} onChange={(e) => setLigne(i, { quantite: Number(e.target.value) })} /></div>
                    <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Mise en place (€)</Label><Input aria-label="Prix mise en place" type="number" min={0} step={50} value={l.prix_setup} onChange={(e) => setLigne(i, { prix_setup: Number(e.target.value) })} /></div>
                    <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Maintenance (€/mois)</Label><Input aria-label="Prix maintenance" type="number" min={0} step={10} value={l.prix_mensuel} onChange={(e) => setLigne(i, { prix_mensuel: Number(e.target.value) })} /></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-1.5"><Label htmlFor="p-cond">Conditions</Label><Textarea id="p-cond" value={f.conditions ?? ""} onChange={(e) => setChamp("conditions", e.target.value)} /></CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-5 lg:sticky lg:top-6">
          <Card>
            <CardHeader><CardTitle>Totaux (HT)</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Mise en place</span><span className="tabular-nums">{euros(t.setupBrut, true)}</span></div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="p-remise" className="font-normal text-muted-foreground">Remise (%)</Label>
                <Input id="p-remise" type="number" min={0} max={100} className="h-8 w-20 text-right" value={f.remise_pct} onChange={(e) => setChamp("remise_pct", Number(e.target.value))} />
              </div>
              {t.remise > 0 && <div className="flex justify-between text-muted-foreground"><span>Remise</span><span className="tabular-nums">− {euros(t.remise, true)}</span></div>}
              <div className="flex justify-between border-t pt-2 font-medium"><span>Mise en place</span><span className="tabular-nums" data-testid="total-setup">{euros(t.setup, true)}</span></div>
              <div className="flex justify-between font-medium"><span>Maintenance</span><span className="tabular-nums" data-testid="total-mensuel">{euros(t.mensuel, true)}/mois</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Valeur 1re année</span><span className="tabular-nums">{euros(t.premiereAnnee)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5"><Label htmlFor="p-envoi">Date d&apos;envoi</Label><Input id="p-envoi" type="date" value={f.date_envoi ?? ""} onChange={(e) => setChamp("date_envoi", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="p-valid">Valable jusqu&apos;au</Label><Input id="p-valid" type="date" value={f.date_validite ?? ""} onChange={(e) => setChamp("date_validite", e.target.value)} /></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmSuppr} onOpenChange={setConfirmSuppr}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {p.numero} ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => startTransition(async () => { const r = await supprimerProposition(p.id); if (!r.ok) return void toast.error(r.erreur); router.push("/propositions"); })}
            >Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
