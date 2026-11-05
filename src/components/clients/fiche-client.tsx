"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, FileText, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionsRapides } from "@/components/hotel/actions-rapides";
import { Etoiles } from "@/components/hotel/etoiles";
import { Timeline } from "@/components/hotel/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { enregistrerAutomatisation, majClient, marquerUpsellTraite, supprimerAutomatisation } from "@/lib/actions/clients";
import { caTotal, mrr } from "@/lib/calculs/clients";
import { STATUTS_AUTOMATISATION, STATUTS_CLIENT } from "@/lib/constantes";
import { aujourdhuiParis, dateCourte } from "@/lib/dates";
import type { ClientAutomatisation, ClientVue, Interaction, Offre, StatutAutomatisation, StatutClient } from "@/lib/types";
import { euros } from "@/lib/utils";

export function FicheClient({
  client: c,
  automatisations,
  interactions,
  offres,
  contact,
}: {
  client: ClientVue;
  automatisations: ClientAutomatisation[];
  interactions: Interaction[];
  offres: Offre[];
  contact: { telephone: string | null; email: string | null; linkedin: string | null } | null;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [edit, setEdit] = useState<Partial<ClientAutomatisation> | null>(null);
  const [infos, setInfos] = useState({ statut: c.statut, date_signature: c.date_signature, date_renouvellement: c.date_renouvellement ?? "", notes: c.notes ?? "" });
  const auj = aujourdhuiParis();
  const upsellDu = automatisations.some((a) => a.statut === "en_production" && !a.upsell_traite && a.date_rappel_upsell && a.date_rappel_upsell <= auj);
  const dejaLivrees = new Set(automatisations.map((a) => a.offre_id).filter(Boolean));
  const suggestions = offres.filter((o) => !dejaLivrees.has(o.id)).slice(0, 3);

  const agir = (fn: () => Promise<{ ok: boolean; erreur?: string }>, msg: string) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.erreur);
      toast.success(msg);
      router.refresh();
    });

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid gap-3">
        <Link href="/clients" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Clients</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">{c.hotel_nom}</h1><Etoiles n={c.etoiles} /></div>
            <p className="text-sm text-muted-foreground">{c.ville} · client depuis le {dateCourte(c.date_signature)} · <Link href={`/prospects/${c.hotel_id}`} className="hover:underline">fiche hôtel</Link></p>
          </div>
          <div className="flex items-center gap-2">
            <ActionsRapides taille="sm" telephone={contact?.telephone} email={contact?.email} linkedin={contact?.linkedin} site={c.site_web} />
            <Button size="sm" variant="outline" asChild><Link href={`/propositions/nouvelle?hotel=${c.hotel_id}`}><FileText /> Nouvelle proposition</Link></Button>
          </div>
        </div>
      </div>

      {upsellDu && (
        <Card className="gap-3 border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="size-4 text-warning" /> C&apos;est le moment de proposer une nouvelle automatisation</CardTitle>
            <CardAction>
              <Button size="xs" variant="ghost" onClick={() => agir(() => marquerUpsellTraite(c.id), "Rappel traité")}><Check /> Marquer traité</Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <p className="text-muted-foreground">La première automatisation tourne depuis 3 mois. Idées :</p>
            {suggestions.map((o) => <p key={o.id}>• <span className="font-medium">{o.nom}</span> <span className="text-muted-foreground">— {o.gain_estime}</span></p>)}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["MRR", euros(mrr(automatisations))],
          ["CA total", euros(caTotal(automatisations))],
          ["Automatisations", String(automatisations.length)],
          ["Renouvellement", dateCourte(c.date_renouvellement)],
        ].map(([l, v]) => (
          <Card key={l} className="gap-1 py-4"><CardContent className="px-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold tabular-nums">{v}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid grid-cols-1 content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Automatisations livrées</CardTitle>
              <CardAction><Button size="xs" variant="ghost" onClick={() => setEdit({ statut: "en_cours", prix_setup: 0, prix_mensuel: 0 })}><Plus /> Ajouter</Button></CardAction>
            </CardHeader>
            <CardContent className="grid gap-2">
              {automatisations.length === 0 && <p className="text-sm text-muted-foreground">Aucune automatisation enregistrée.</p>}
              {automatisations.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3" data-automatisation={a.nom}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{a.nom}</p>
                      <Badge variant={a.statut === "en_production" ? "success" : a.statut === "en_cours" ? "warning" : "secondary"}>{STATUTS_AUTOMATISATION[a.statut]}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {euros(a.prix_setup)} + {euros(a.prix_mensuel)}/mois
                      {a.date_mise_en_service && <> · en service depuis le {dateCourte(a.date_mise_en_service)}</>}
                      {a.date_livraison && !a.date_mise_en_service && <> · livraison {dateCourte(a.date_livraison)}</>}
                      {a.date_rappel_upsell && !a.upsell_traite && <> · upsell le {dateCourte(a.date_rappel_upsell)}</>}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-xs" aria-label={`Actions ${a.nom}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEdit(a)}><Pencil /> Modifier</DropdownMenuItem>
                      {a.statut === "en_cours" && (
                        <DropdownMenuItem onSelect={() => agir(() => enregistrerAutomatisation(c.id, { statut: "en_production", date_mise_en_service: auj, date_livraison: a.date_livraison ?? auj }, a.id), "Mise en service enregistrée")}>
                          <Check /> Mettre en service aujourd&apos;hui
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onSelect={() => agir(() => supprimerAutomatisation(a.id, c.id), "Supprimée")}><Trash2 /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>
          <Timeline hotelId={c.hotel_id} interactions={interactions} />
        </div>

        <Card className="content-start">
          <CardHeader><CardTitle>Suivi</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Statut</Label>
              <Select value={infos.statut} onValueChange={(v) => setInfos((x) => ({ ...x, statut: v as StatutClient }))}>
                <SelectTrigger aria-label="Statut du client"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUTS_CLIENT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label htmlFor="c-sign">Signé le</Label><Input id="c-sign" type="date" value={infos.date_signature} onChange={(e) => setInfos((x) => ({ ...x, date_signature: e.target.value }))} /></div>
              <div className="grid gap-1.5"><Label htmlFor="c-renouv">Renouvellement</Label><Input id="c-renouv" type="date" value={infos.date_renouvellement} onChange={(e) => setInfos((x) => ({ ...x, date_renouvellement: e.target.value }))} /></div>
            </div>
            <div className="grid gap-1.5"><Label htmlFor="c-notes">Notes</Label><Textarea id="c-notes" className="min-h-28" value={infos.notes} onChange={(e) => setInfos((x) => ({ ...x, notes: e.target.value }))} /></div>
            <Button
              size="sm"
              className="w-fit"
              disabled={enCours}
              onClick={() => agir(() => majClient(c.id, { ...infos, date_renouvellement: infos.date_renouvellement || null, notes: infos.notes || null }), "Fiche client enregistrée")}
            >
              {enCours && <Loader2 className="animate-spin" />}Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>

      <AutomatisationDialog clientId={c.id} auto={edit} offres={offres} onClose={() => setEdit(null)} />
    </div>
  );
}

function AutomatisationDialog({ clientId, auto, offres, onClose }: { clientId: string; auto: Partial<ClientAutomatisation> | null; offres: Offre[]; onClose: () => void }) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [f, setF] = useState<Partial<ClientAutomatisation>>({});
  const [cle, setCle] = useState<object | null>(null);
  if (auto && cle !== auto) { setCle(auto); setF(auto); }
  const set = <K extends keyof ClientAutomatisation>(k: K, v: ClientAutomatisation[K]) => setF((p) => ({ ...p, [k]: v }));
  const choisirOffre = (id: string) => {
    const o = offres.find((x) => x.id === id);
    if (o) setF((p) => ({ ...p, offre_id: o.id, nom: o.nom, prix_setup: o.prix_setup_indicatif, prix_mensuel: o.prix_mensuel_indicatif }));
  };
  const valider = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await enregistrerAutomatisation(clientId, f, auto?.id);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success("Automatisation enregistrée");
      onClose();
      router.refresh();
    });
  };
  return (
    <Dialog open={!!auto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{auto?.id ? "Modifier l'automatisation" : "Nouvelle automatisation"}</DialogTitle></DialogHeader>
        <form id="form-auto" onSubmit={valider} className="grid gap-3">
          {!auto?.id && (
            <div className="grid gap-1.5">
              <Label>Depuis la bibliothèque</Label>
              <Select value={f.offre_id ?? ""} onValueChange={choisirOffre}>
                <SelectTrigger aria-label="Offre"><SelectValue placeholder="Choisir une offre (optionnel)…" /></SelectTrigger>
                <SelectContent>{offres.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5"><Label htmlFor="a-nom">Nom</Label><Input id="a-nom" required value={f.nom ?? ""} onChange={(e) => set("nom", e.target.value)} /></div>
          <div className="grid gap-1.5">
            <Label>Statut</Label>
            <Select value={f.statut} onValueChange={(v) => set("statut", v as StatutAutomatisation)}>
              <SelectTrigger aria-label="Statut"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUTS_AUTOMATISATION).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="a-liv">Livraison</Label><Input id="a-liv" type="date" value={f.date_livraison ?? ""} onChange={(e) => set("date_livraison", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="a-mes">Mise en service</Label><Input id="a-mes" type="date" value={f.date_mise_en_service ?? ""} onChange={(e) => set("date_mise_en_service", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="a-setup">Mise en place (€)</Label><Input id="a-setup" type="number" min={0} value={f.prix_setup ?? 0} onChange={(e) => set("prix_setup", Number(e.target.value))} /></div>
            <div className="grid gap-1.5"><Label htmlFor="a-mensuel">Abonnement (€/mois)</Label><Input id="a-mensuel" type="number" min={0} value={f.prix_mensuel ?? 0} onChange={(e) => set("prix_mensuel", Number(e.target.value))} /></div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="form-auto" disabled={enCours}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
