"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ExternalLink, FileText, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supprimerHotel } from "@/lib/actions/hotels";
import { RAISONS_PERTE, STATUTS_PROPOSITION, TYPES_HOTEL } from "@/lib/constantes";
import type { Listes } from "@/lib/data";
import { dateCourte, depuis } from "@/lib/dates";
import { aContacterMaintenant, etapeSuivante } from "@/lib/pipeline";
import type { Contact, Etape, HotelVue, Interaction, Offre, Proposition, Relance } from "@/lib/types";
import { euros, urlExterne } from "@/lib/utils";
import { ActionsRapides } from "./actions-rapides";
import { Contacts } from "./contacts";
import { EtapeBadge, PrioriteBadge } from "./etape-badge";
import { Etoiles } from "./etoiles";
import { HotelForm } from "./hotel-form";
import { resumeMois } from "./mois-select";
import { ProchainesActions } from "./prochaines-actions";
import { Timeline } from "./timeline";
import { useChangerEtape } from "./use-changer-etape";

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-2 py-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children ?? "—"}</dd>
    </div>
  );
}

function Lien({ href, children }: { href: string | null; children: React.ReactNode }) {
  const url = urlExterne(href);
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
      {children} <ExternalLink className="size-3" />
    </a>
  );
}

/** Vrai si l'utilisateur est en train de taper dans un champ. */
export const enSaisie = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || !!t.closest("[role=dialog]"));
};

export function FicheHotel({
  hotel: h,
  contacts,
  interactions,
  relances,
  propositions,
  etapes,
  listes,
  offres,
}: {
  hotel: HotelVue;
  contacts: Contact[];
  interactions: Interaction[];
  relances: Relance[];
  propositions: Proposition[];
  etapes: Etape[];
  listes: Listes;
  offres: Offre[];
}) {
  const router = useRouter();
  const [edition, setEdition] = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState(false);
  const [, startTransition] = useTransition();
  const { demander, dialog } = useChangerEtape(etapes);
  const suivante = etapeSuivante(etapes, h.etape_id);
  const principal = contacts[0];

  // Raccourci « E » : éditer la fiche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && !e.metaKey && !e.ctrlKey && !e.altKey && !enSaisie(e)) {
        e.preventDefault();
        setEdition(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const recommandees = offres
    .map((o) => ({ o, score: o.douleurs_associees.filter((d) => h.douleurs.includes(d)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const supprimer = () =>
    startTransition(async () => {
      const r = await supprimerHotel(h.id);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success("Hôtel supprimé");
      router.push("/prospects");
    });

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid gap-3">
        <Link href="/prospects" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Prospects
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{h.nom}</h1>
              <Etoiles n={h.etoiles} className="[&_svg]:size-3.5" />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {h.ville && <span>{h.ville}</span>}
              {h.nb_chambres != null && <span>· {h.nb_chambres} chambres</span>}
              {h.type_hotel && <span>· {TYPES_HOTEL[h.type_hotel]}</span>}
              <PrioriteBadge priorite={h.priorite} />
              {h.client_id && <Badge variant="success">Client</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActionsRapides
              taille="sm"
              telephone={principal?.telephone}
              email={principal?.email}
              linkedin={principal?.linkedin}
              site={h.site_web}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Changer d'étape">
                  <EtapeBadge nom={h.etape_nom} couleur={h.etape_couleur} className="border-0 bg-transparent px-0" />
                  <ChevronDown className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {etapes.map((e) => (
                  <DropdownMenuItem key={e.id} disabled={e.id === h.etape_id} onSelect={() => demander(h.id, h.nom, e.id)}>
                    <EtapeBadge nom={e.nom} couleur={e.couleur} className="border-0 bg-transparent px-0" />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {suivante && (
              <Button size="sm" variant="secondary" onClick={() => demander(h.id, h.nom, suivante.id)}>
                → {suivante.nom}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setEdition(true)}>
              <Pencil /> Modifier <kbd className="ml-1 rounded border px-1 text-[10px] text-muted-foreground">E</kbd>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Plus d'actions"><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/propositions/nouvelle?hotel=${h.id}`}><FileText /> Créer une proposition</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmSuppr(true)}><Trash2 /> Supprimer l&apos;hôtel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {h.etape_code === "perdu" && h.raison_perte && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <span className="font-medium text-destructive">Perdu — {RAISONS_PERTE[h.raison_perte]}</span>
          {h.detail_perte && <span className="text-muted-foreground"> · {h.detail_perte}</span>}
          {h.date_recontact && <span className="text-muted-foreground"> · Recontacter le {dateCourte(h.date_recontact)}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="grid grid-cols-1 content-start gap-5">
          <Card>
            <CardHeader><CardTitle>Commercial</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-3 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Mise en place</p>
                  <p className="text-lg font-semibold tabular-nums">{euros(h.montant_setup_estime)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                  <p className="text-lg font-semibold tabular-nums">{euros(h.montant_mensuel_estime)}<span className="text-xs font-normal text-muted-foreground">/mois</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pondéré ({h.probabilite} %)</p>
                  <p className="text-lg font-semibold tabular-nums">{euros(h.valeur_ponderee)}</p>
                </div>
              </div>
              <dl>
                <Ligne label="Source">{h.source}</Ligne>
                <Ligne label="Dans l'étape">{depuis(h.date_entree_etape)}</Ligne>
                <Ligne label="Douleurs">
                  {h.douleurs.length ? (
                    <div className="flex flex-wrap gap-1">{h.douleurs.map((d) => <Badge key={d} variant="destructive">{d}</Badge>)}</div>
                  ) : "—"}
                </Ligne>
              </dl>
            </CardContent>
          </Card>

          {recommandees.length > 0 && (
            <Card className="border-primary/30 bg-primary/[0.03]">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5"><Sparkles className="size-4 text-primary" /> À proposer</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {recommandees.slice(0, 4).map(({ o }) => (
                  <div key={o.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{o.nom}</p>
                      <p className="text-xs text-muted-foreground">{o.gain_estime}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {euros(o.prix_setup_indicatif)} + {euros(o.prix_mensuel_indicatif)}/m
                    </span>
                  </div>
                ))}
                <Button asChild variant="outline" size="sm" className="mt-1 w-fit">
                  <Link href={`/propositions/nouvelle?hotel=${h.id}`}><FileText /> Créer une proposition</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Hôtel</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <Ligne label="Adresse">{[h.adresse, [h.code_postal, h.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null}</Ligne>
                <Ligne label="Liens">
                  <div className="flex flex-wrap gap-3">
                    <Lien href={h.site_web}>Site</Lien>
                    <Lien href={h.url_booking}>Booking</Lien>
                    <Lien href={h.url_google_maps}>Maps</Lien>
                  </div>
                </Ligne>
                <Ligne label="Services">
                  {h.services.length ? <div className="flex flex-wrap gap-1">{h.services.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div> : null}
                </Ligne>
                <Ligne label="Ouverture">{h.ouverture === "annuelle" ? "À l'année" : "Saisonnier"}</Ligne>
                <Ligne label="Haute saison">{resumeMois(h.mois_haute_saison)}</Ligne>
                <Ligne label="Période creuse">
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    {resumeMois(h.mois_creux)}
                    {aContacterMaintenant(h.mois_creux) && <Badge variant="warning">À contacter maintenant</Badge>}
                  </span>
                </Ligne>
              </dl>
            </CardContent>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Réputation</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Google</p>
                  <p className="text-lg font-semibold tabular-nums">{h.note_google ?? "—"}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
                  <p className="text-xs text-muted-foreground">{h.nb_avis_google ?? 0} avis</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Booking</p>
                  <p className="text-lg font-semibold tabular-nums">{h.note_booking ?? "—"}<span className="text-xs font-normal text-muted-foreground">/10</span></p>
                  <p className="text-xs text-muted-foreground">{h.nb_avis_booking ?? 0} avis</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Stack technique</CardTitle></CardHeader>
              <CardContent>
                <dl className="[&>div]:grid-cols-[100px_minmax(0,1fr)]">
                  <Ligne label="PMS">{h.pms}</Ligne>
                  <Ligne label="Channel m.">{h.channel_manager}</Ligne>
                  <Ligne label="Moteur résa">{h.moteur_reservation}</Ligne>
                  <Ligne label="CRM">{h.crm}</Ligne>
                </dl>
              </CardContent>
            </Card>
          </div>

          {propositions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Propositions</CardTitle></CardHeader>
              <CardContent className="grid gap-1">
                {propositions.map((p) => (
                  <Link key={p.id} href={`/propositions/${p.id}`} className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-accent">
                    <span className="truncate"><span className="text-muted-foreground">{p.numero}</span> {p.titre}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums">{euros(p.total_setup)} + {euros(p.total_mensuel)}/m</span>
                      <Badge variant={p.statut === "acceptee" ? "success" : p.statut === "refusee" ? "destructive" : "secondary"}>{STATUTS_PROPOSITION[p.statut]}</Badge>
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 content-start gap-5">
          <ProchainesActions hotelId={h.id} relances={relances} />
          <Contacts hotelId={h.id} contacts={contacts} />
          <Timeline hotelId={h.id} interactions={interactions} />
        </div>
      </div>

      <HotelForm ouvert={edition} onOpenChange={setEdition} hotel={h} etapes={etapes} listes={listes} />
      <AlertDialog open={confirmSuppr} onOpenChange={setConfirmSuppr}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {h.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>Contacts, notes, relances et propositions seront aussi supprimés. Action irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={supprimer} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {dialog}
    </div>
  );
}
