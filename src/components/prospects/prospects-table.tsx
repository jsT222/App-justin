"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Plus, Search, Upload, X } from "lucide-react";
import { PageEntete } from "@/components/layout/page-entete";
import { ActionsRapides } from "@/components/hotel/actions-rapides";
import { EtapeBadge, PrioriteBadge } from "@/components/hotel/etape-badge";
import { Etoiles } from "@/components/hotel/etoiles";
import { HotelForm } from "@/components/hotel/hotel-form";
import { useChangerEtape } from "@/components/hotel/use-changer-etape";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRIORITES, TYPES_HOTEL } from "@/lib/constantes";
import type { Listes } from "@/lib/data";
import { dateRelative, estEnRetard } from "@/lib/dates";
import { etapeSuivante } from "@/lib/pipeline";
import type { Etape, HotelVue } from "@/lib/types";
import { cn, euros, normaliser } from "@/lib/utils";
import { FiltreMulti } from "./filtre-multi";
import { ImportCsv } from "./import-csv";

const TRANCHES = [
  { valeur: "0-19", label: "Moins de 20", min: 0, max: 19 },
  { valeur: "20-49", label: "20 à 49", min: 20, max: 49 },
  { valeur: "50-99", label: "50 à 99", min: 50, max: 99 },
  { valeur: "100+", label: "100 et plus", min: 100, max: Infinity },
];

type Tri = { col: "nom" | "ville" | "etoiles" | "nb_chambres" | "etape_ordre" | "valeur_annuelle" | "prochaine_action_date" | "created_at"; sens: 1 | -1 };
type Filtres = Record<"etape" | "etoiles" | "chambres" | "ville" | "type" | "pms" | "priorite" | "source", string[]>;
const FILTRES_VIDES: Filtres = { etape: [], etoiles: [], chambres: [], ville: [], type: [], pms: [], priorite: [], source: [] };

const uniques = (v: (string | null | undefined)[]) => Array.from(new Set(v.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "fr"));

export function ProspectsTable({ hotels, etapes, listes }: { hotels: HotelVue[]; etapes: Etape[]; listes: Listes }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [tri, setTri] = useState<Tri>({ col: "created_at", sens: -1 });
  const [nouveau, setNouveau] = useState(false);
  const [importOuvert, setImportOuvert] = useState(false);
  const { demander, dialog } = useChangerEtape(etapes);

  const compteDoublons = useMemo(() => {
    const m = new Map<string, number>();
    hotels.forEach((h) => m.set(h.cle_doublon, (m.get(h.cle_doublon) ?? 0) + 1));
    return m;
  }, [hotels]);

  const visibles = useMemo(() => {
    const q = normaliser(recherche);
    const f = filtres;
    return hotels
      .filter((h) => {
        if (q && !normaliser(`${h.nom} ${h.ville} ${h.contact_nom} ${h.contact_email}`).includes(q)) return false;
        if (f.etape.length && !f.etape.includes(h.etape_id ?? "")) return false;
        if (f.etoiles.length && !f.etoiles.includes(String(h.etoiles ?? "0"))) return false;
        if (f.chambres.length && !f.chambres.some((t) => {
          const tr = TRANCHES.find((x) => x.valeur === t)!;
          return h.nb_chambres != null && h.nb_chambres >= tr.min && h.nb_chambres <= tr.max;
        })) return false;
        if (f.ville.length && !f.ville.includes(h.ville ?? "")) return false;
        if (f.type.length && !f.type.includes(h.type_hotel ?? "")) return false;
        if (f.pms.length && !f.pms.includes(h.pms ?? "")) return false;
        if (f.priorite.length && !f.priorite.includes(h.priorite)) return false;
        if (f.source.length && !f.source.includes(h.source ?? "")) return false;
        return true;
      })
      .sort((a, b) => {
        const va = a[tri.col] ?? (tri.sens === 1 ? Infinity : -Infinity);
        const vb = b[tri.col] ?? (tri.sens === 1 ? Infinity : -Infinity);
        if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb, "fr") * tri.sens;
        return (va < vb ? -1 : va > vb ? 1 : 0) * tri.sens;
      });
  }, [hotels, recherche, filtres, tri]);

  const nbFiltres = Object.values(filtres).reduce((n, v) => n + v.length, 0);
  const setFiltre = (k: keyof Filtres) => (v: string[]) => setFiltres((p) => ({ ...p, [k]: v }));

  const exporter = () => {
    const lignes = visibles.map((h) => ({
      Nom: h.nom, Ville: h.ville, Adresse: h.adresse, "Code postal": h.code_postal, Département: h.departement,
      Étoiles: h.etoiles, Chambres: h.nb_chambres, Type: h.type_hotel ? TYPES_HOTEL[h.type_hotel] : "",
      Étape: h.etape_nom, Priorité: PRIORITES[h.priorite], Source: h.source, PMS: h.pms,
      "Mise en place (€)": h.montant_setup_estime, "Maintenance (€/mois)": h.montant_mensuel_estime, "Probabilité (%)": h.probabilite,
      Contact: h.contact_nom, Email: h.contact_email, Téléphone: h.contact_telephone, LinkedIn: h.contact_linkedin,
      "Site web": h.site_web, Booking: h.url_booking, "Google Maps": h.url_google_maps,
      "Note Google": h.note_google, "Avis Google": h.nb_avis_google, "Note Booking": h.note_booking, "Avis Booking": h.nb_avis_booking,
      Douleurs: h.douleurs.join(", "), Services: h.services.join(", "),
      "Prochaine action": h.prochaine_action_titre, "Date prochaine action": h.prochaine_action_date?.slice(0, 10),
    }));
    const csv = "﻿" + Papa.unparse(lignes, { delimiter: ";" });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `prospects-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const EnTete = ({ col, children, className }: { col: Tri["col"]; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => setTri((t) => ({ col, sens: t.col === col ? (t.sens === 1 ? -1 : 1) : 1 }))}
      >
        {children}
        {tri.col === col ? (tri.sens === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-30" />}
      </button>
    </TableHead>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageEntete
        titre="Prospects"
        description={`${visibles.length} hôtel${visibles.length > 1 ? "s" : ""}${nbFiltres || recherche ? ` sur ${hotels.length}` : ""}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setImportOuvert(true)}><Upload /> Importer</Button>
            <Button variant="outline" size="sm" onClick={exporter}><Download /> Exporter</Button>
            <Button size="sm" onClick={() => setNouveau(true)}><Plus /> Nouveau prospect</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="recherche-prospects"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher un prospect"
            className="h-8 pl-8"
          />
        </div>
        <FiltreMulti label="Étape" valeurs={filtres.etape} onChange={setFiltre("etape")} options={etapes.map((e) => ({ valeur: e.id, label: e.nom }))} />
        <FiltreMulti label="Étoiles" valeurs={filtres.etoiles} onChange={setFiltre("etoiles")} options={[1, 2, 3, 4, 5].map((n) => ({ valeur: String(n), label: `${n} étoile${n > 1 ? "s" : ""}` }))} />
        <FiltreMulti label="Chambres" valeurs={filtres.chambres} onChange={setFiltre("chambres")} options={TRANCHES} />
        <FiltreMulti label="Ville" valeurs={filtres.ville} onChange={setFiltre("ville")} options={uniques(hotels.map((h) => h.ville)).map((v) => ({ valeur: v, label: v }))} />
        <FiltreMulti label="Type" valeurs={filtres.type} onChange={setFiltre("type")} options={Object.entries(TYPES_HOTEL).map(([k, v]) => ({ valeur: k, label: v }))} />
        <FiltreMulti label="PMS" valeurs={filtres.pms} onChange={setFiltre("pms")} options={uniques([...listes.pms, ...hotels.map((h) => h.pms)]).map((v) => ({ valeur: v, label: v }))} />
        <FiltreMulti label="Priorité" valeurs={filtres.priorite} onChange={setFiltre("priorite")} options={Object.entries(PRIORITES).map(([k, v]) => ({ valeur: k, label: v }))} />
        <FiltreMulti label="Source" valeurs={filtres.source} onChange={setFiltre("source")} options={uniques([...listes.source, ...hotels.map((h) => h.source)]).map((v) => ({ valeur: v, label: v }))} />
        {(nbFiltres > 0 || recherche) && (
          <Button variant="ghost" size="sm" onClick={() => { setFiltres(FILTRES_VIDES); setRecherche(""); }}>
            <X /> Réinitialiser
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <EnTete col="nom" className="pl-3">Hôtel</EnTete>
              <EnTete col="ville" className="hidden md:table-cell">Ville</EnTete>
              <EnTete col="nb_chambres" className="hidden lg:table-cell">Chambres</EnTete>
              <EnTete col="etape_ordre">Étape</EnTete>
              <TableHead className="hidden 2xl:table-cell">Contact</TableHead>
              <EnTete col="valeur_annuelle" className="hidden sm:table-cell">Montant</EnTete>
              <EnTete col="prochaine_action_date" className="hidden md:table-cell">Prochaine action</EnTete>
              <TableHead className="w-0"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((h) => {
              const suivante = etapeSuivante(etapes, h.etape_id);
              const retard = estEnRetard(h.prochaine_action_date);
              return (
                <TableRow key={h.id} className="cursor-pointer" onClick={() => router.push(`/prospects/${h.id}`)}>
                  <TableCell className="pl-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{h.nom}</span>
                      <Etoiles n={h.etoiles} />
                      {(compteDoublons.get(h.cle_doublon) ?? 0) > 1 && <Badge variant="warning">Doublon</Badge>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground md:hidden">{h.ville}</div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{h.ville ?? "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">{h.nb_chambres ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <EtapeBadge nom={h.etape_nom} couleur={h.etape_couleur} />
                      {h.priorite === "haute" && <PrioriteBadge priorite="haute" />}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-40 truncate text-muted-foreground 2xl:table-cell">{h.contact_nom ?? "—"}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {h.montant_setup_estime || h.montant_mensuel_estime ? (
                      <>
                        {euros(h.montant_setup_estime)}
                        {h.montant_mensuel_estime > 0 && <span className="text-muted-foreground"> + {euros(h.montant_mensuel_estime)}/m</span>}
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-56 md:table-cell">
                    {h.prochaine_action_date ? (
                      <div className={cn("truncate text-xs", retard && "font-medium text-destructive")}>
                        {dateRelative(h.prochaine_action_date, false)} · <span className={cn(!retard && "text-muted-foreground")}>{h.prochaine_action_titre}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="pr-2">
                    <ActionsRapides
                      telephone={h.contact_telephone}
                      email={h.contact_email}
                      linkedin={h.contact_linkedin}
                      site={h.site_web}
                      etapeSuivante={suivante?.nom}
                      onEtapeSuivante={suivante ? () => demander(h.id, h.nom, suivante.id) : undefined}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {visibles.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  {hotels.length === 0 ? "Aucun prospect. Ajoute ton premier hôtel ou importe un CSV." : "Aucun hôtel ne correspond aux filtres."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <HotelForm ouvert={nouveau} onOpenChange={setNouveau} etapes={etapes} listes={listes} onEnregistre={(id) => router.push(`/prospects/${id}`)} />
      <ImportCsv ouvert={importOuvert} onOpenChange={setImportOuvert} etapes={etapes} listes={listes} clesExistantes={hotels.map((h) => h.cle_doublon)} />
      {dialog}
    </div>
  );
}
