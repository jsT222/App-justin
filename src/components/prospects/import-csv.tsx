"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { importerHotels } from "@/lib/actions/hotels";
import { analyserDoublons, CHAMPS_IMPORT, convertirLigne, devinerCorrespondance, type ChampImport, type Correspondance } from "@/lib/csv";
import type { Listes } from "@/lib/data";
import type { Etape } from "@/lib/types";

const AUCUNE = "__aucune__";

export function ImportCsv({
  ouvert,
  onOpenChange,
  etapes,
  listes,
  clesExistantes,
}: {
  ouvert: boolean;
  onOpenChange: (o: boolean) => void;
  etapes: Etape[];
  listes: Listes;
  clesExistantes: string[];
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [fichier, setFichier] = useState<string | null>(null);
  const [entetes, setEntetes] = useState<string[]>([]);
  const [lignes, setLignes] = useState<Record<string, string>[]>([]);
  const [corresp, setCorresp] = useState<Correspondance>({});
  const [source, setSource] = useState<string>(listes.source[0] ?? "");
  const [etapeId, setEtapeId] = useState<string>(etapes[0]?.id ?? "");
  const [ignorerDoublons, setIgnorerDoublons] = useState(true);

  const reinitialiser = () => {
    setFichier(null);
    setEntetes([]);
    setLignes([]);
    setCorresp({});
  };

  const lire = (f: File) => {
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const cols = (res.meta.fields ?? []).filter(Boolean);
        if (!cols.length || !res.data.length) {
          toast.error("Fichier vide ou illisible.");
          return;
        }
        setFichier(f.name);
        setEntetes(cols);
        setLignes(res.data);
        setCorresp(devinerCorrespondance(cols));
      },
      error: (e) => toast.error(`Lecture impossible : ${e.message}`),
    });
  };

  const analyse = useMemo(() => {
    const converties = lignes.map((l) => convertirLigne(l, corresp, { source, etape_id: etapeId })).filter((l) => l !== null);
    return analyserDoublons(converties, new Set(clesExistantes));
  }, [lignes, corresp, source, etapeId, clesExistantes]);

  const nbDoublons = analyse.filter((a) => a.doublon).length;
  const aImporter = analyse.filter((a) => !(ignorerDoublons && a.doublon)).map((a) => a.ligne);

  const importer = () =>
    startTransition(async () => {
      const r = await importerHotels(aImporter);
      if (!r.ok) {
        toast.error(r.erreur);
        return;
      }
      toast.success(`${r.data?.crees} prospect(s) importé(s)`);
      reinitialiser();
      onOpenChange(false);
      router.refresh();
    });

  return (
    <Dialog open={ouvert} onOpenChange={(o) => { if (!o) reinitialiser(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer des prospects (CSV)</DialogTitle>
          <DialogDescription>Export LinkedIn / Sales Navigator, Google Sheets (Fichier → Télécharger → CSV) ou scraping Google Maps.</DialogDescription>
        </DialogHeader>

        {!fichier ? (
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center text-sm text-muted-foreground hover:bg-accent/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) lire(f);
            }}
          >
            <FileUp className="size-8" />
            <span>Glisse un fichier .csv ici ou <span className="font-medium text-foreground underline">parcours</span></span>
            <input type="file" accept=".csv,text/csv" className="sr-only" aria-label="Fichier CSV" onChange={(e) => e.target.files?.[0] && lire(e.target.files[0])} />
          </label>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm">
              <span className="font-medium">{fichier}</span> — {lignes.length} ligne(s), {entetes.length} colonne(s).{" "}
              <button className="text-muted-foreground underline" onClick={reinitialiser}>Changer de fichier</button>
            </p>

            <div className="grid max-h-[40vh] gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
              {CHAMPS_IMPORT.map((c) => (
                <div key={c.cle} className="grid grid-cols-[1fr_1.2fr] items-center gap-2">
                  <Label className="text-xs">{c.label}{"requis" in c && c.requis ? " *" : ""}</Label>
                  <Select
                    value={corresp[c.cle] ?? AUCUNE}
                    onValueChange={(v) => setCorresp((p) => ({ ...p, [c.cle as ChampImport]: v === AUCUNE ? undefined : v }))}
                  >
                    <SelectTrigger size="sm" aria-label={`Colonne pour ${c.label}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AUCUNE}>— Ignorer —</SelectItem>
                      {entetes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Source par défaut</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{listes.source.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Étape</Label>
                <Select value={etapeId} onValueChange={setEtapeId}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{etapes.map((e) => <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm">
              {!corresp.nom ? (
                <span className="text-destructive">Choisis la colonne qui contient le nom de l&apos;hôtel.</span>
              ) : (
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span><strong>{analyse.length}</strong> hôtel(s) détecté(s)</span>
                    {nbDoublons > 0 && <Badge variant="warning">{nbDoublons} doublon(s)</Badge>}
                  </div>
                  {nbDoublons > 0 && (
                    <label className="flex items-center gap-2">
                      <Checkbox checked={ignorerDoublons} onCheckedChange={(c) => setIgnorerDoublons(!!c)} />
                      Ignorer les doublons (même nom + même ville)
                    </label>
                  )}
                  <ul className="max-h-28 overflow-y-auto text-xs text-muted-foreground">
                    {analyse.slice(0, 50).map((a, i) => (
                      <li key={i} className={a.doublon && ignorerDoublons ? "line-through opacity-60" : ""}>
                        {a.ligne.hotel.nom} {a.ligne.hotel.ville ? `— ${a.ligne.hotel.ville}` : ""}
                        {a.doublon === "existant" && " (déjà dans le CRM)"}
                        {a.doublon === "fichier" && " (en double dans le fichier)"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button disabled={!fichier || !corresp.nom || aImporter.length === 0 || enCours} onClick={importer}>
            {enCours && <Loader2 className="animate-spin" />}
            Importer {aImporter.length > 0 ? `${aImporter.length} prospect(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
