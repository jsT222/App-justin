"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CalendarClock, Eye, EyeOff, Plus, Search, User } from "lucide-react";
import { PageEntete } from "@/components/layout/page-entete";
import { ActionsRapides } from "@/components/hotel/actions-rapides";
import { Etoiles } from "@/components/hotel/etoiles";
import { HotelForm } from "@/components/hotel/hotel-form";
import { useChangerEtape } from "@/components/hotel/use-changer-etape";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { couleurEtape } from "@/lib/constantes";
import type { Listes } from "@/lib/data";
import { dateRelative, estEnRetard } from "@/lib/dates";
import { etapeSuivante } from "@/lib/pipeline";
import type { Etape, HotelVue } from "@/lib/types";
import { cn, euros, normaliser } from "@/lib/utils";

function Carte({ h, etapes, onSuivante, enDrag }: { h: HotelVue; etapes: Etape[]; onSuivante?: (etapeId: string) => void; enDrag?: boolean }) {
  const suivante = etapeSuivante(etapes, h.etape_id);
  const retard = estEnRetard(h.prochaine_action_date);
  return (
    <div className={cn("group rounded-lg border bg-card p-2.5 text-sm shadow-xs transition-shadow hover:shadow-md", enDrag && "rotate-1 shadow-lg ring-2 ring-primary/30")}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/prospects/${h.id}`} className="min-w-0 font-medium leading-snug hover:underline" onClick={(e) => enDrag && e.preventDefault()}>
          {h.nom}
        </Link>
        {h.priorite === "haute" && <span className="mt-1 size-2 shrink-0 rounded-full bg-red-500" title="Priorité haute" />}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Etoiles n={h.etoiles} />
        {h.nb_chambres != null && <span>{h.nb_chambres} ch.</span>}
        {h.ville && <span className="truncate">· {h.ville}</span>}
      </div>
      {h.contact_nom && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <User className="size-3" /> <span className="truncate">{h.contact_nom}</span>
        </div>
      )}
      {(h.montant_setup_estime > 0 || h.montant_mensuel_estime > 0) && (
        <div className="mt-1.5 text-xs font-medium tabular-nums">
          {euros(h.montant_setup_estime)}
          {h.montant_mensuel_estime > 0 && <span className="font-normal text-muted-foreground"> + {euros(h.montant_mensuel_estime)}/mois</span>}
        </div>
      )}
      {h.prochaine_action_date && (
        <div className={cn("mt-1.5 flex items-center gap-1 text-xs text-muted-foreground", retard && "font-medium text-destructive")}>
          <CalendarClock className="size-3 shrink-0" />
          <span className="truncate">{dateRelative(h.prochaine_action_date, false)} · {h.prochaine_action_titre}</span>
        </div>
      )}
      <ActionsRapides
        className="-mx-1 mt-1.5 opacity-60 transition-opacity group-hover:opacity-100"
        telephone={h.contact_telephone}
        email={h.contact_email}
        linkedin={h.contact_linkedin}
        site={h.site_web}
        etapeSuivante={suivante?.nom}
        onEtapeSuivante={suivante && onSuivante ? () => onSuivante(suivante.id) : undefined}
      />
    </div>
  );
}

function CarteDraggable({ h, etapes, onSuivante }: { h: HotelVue; etapes: Etape[]; onSuivante: (etapeId: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: h.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} aria-label={`Déplacer ${h.nom}`} data-hotel={h.nom} className={cn("touch-manipulation cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}>
      <Carte h={h} etapes={etapes} onSuivante={onSuivante} />
    </div>
  );
}

function Colonne({ etape, hotels, children }: { etape: Etape; hotels: HotelVue[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: etape.id });
  const total = hotels.reduce((s, h) => s + h.valeur_annuelle, 0);
  const pondere = hotels.reduce((s, h) => s + h.valeur_ponderee, 0);
  const c = couleurEtape(etape.couleur);
  return (
    <section
      ref={setNodeRef}
      aria-label={`Colonne ${etape.nom}`}
      data-etape={etape.nom}
      className={cn("flex w-72 shrink-0 flex-col rounded-xl bg-muted/50 transition-colors", isOver && "bg-primary/10 ring-2 ring-primary/30")}
    >
      <header className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", c.pastille)} />
          <h2 className="text-sm font-medium">{etape.nom}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{hotels.length}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums" data-total>
          {euros(total)}
          {etape.code !== "gagne" && etape.code !== "perdu" && total > 0 && <> · pondéré {euros(pondere)}</>}
        </p>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">{children}</div>
    </section>
  );
}

export function Kanban({ hotels: initiaux, etapes, listes }: { hotels: HotelVue[]; etapes: Etape[]; listes: Listes }) {
  const router = useRouter();
  const [hotels, setHotels] = useState(initiaux);
  const [source, setSource] = useState(initiaux);
  const [actif, setActif] = useState<HotelVue | null>(null);
  const [recherche, setRecherche] = useState("");
  const [masquerPerdus, setMasquerPerdus] = useState(false);
  const [nouveau, setNouveau] = useState(false);

  // Resynchronise quand le serveur renvoie de nouvelles données
  if (initiaux !== source) {
    setSource(initiaux);
    setHotels(initiaux);
  }

  const { demander, dialog } = useChangerEtape(etapes, {
    onOptimiste: (hotelId, etapeId) => {
      const e = etapes.find((x) => x.id === etapeId);
      setHotels((hs) => hs.map((h) => (h.id === hotelId ? { ...h, etape_id: etapeId, etape_nom: e?.nom ?? h.etape_nom, etape_code: e?.code ?? null } : h)));
    },
    onAnnule: () => setHotels(initiaux),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const filtres = useMemo(() => {
    const q = normaliser(recherche);
    return q ? hotels.filter((h) => normaliser(`${h.nom} ${h.ville} ${h.contact_nom}`).includes(q)) : hotels;
  }, [hotels, recherche]);

  const colonnes = etapes.filter((e) => !(masquerPerdus && e.code === "perdu"));
  const ouverts = hotels.filter((h) => h.etape_code !== "gagne" && h.etape_code !== "perdu");
  const totalPondere = ouverts.reduce((s, h) => s + h.valeur_ponderee, 0);

  const onDragStart = (e: DragStartEvent) => setActif(hotels.find((h) => h.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setActif(null);
    const h = hotels.find((x) => x.id === e.active.id);
    const cible = e.over?.id as string | undefined;
    if (!h || !cible || cible === h.etape_id) return;
    demander(h.id, h.nom, cible);
  };

  return (
    <div className="grid grid-cols-1 gap-4" data-pleine-largeur>
      <PageEntete
        titre="Pipeline"
        description={<>{ouverts.length} affaires en cours · pipeline pondéré <span className="font-medium text-foreground">{euros(totalPondere)}</span></>}
        actions={
          <>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Filtrer…" aria-label="Filtrer le pipeline" className="h-8 w-44 pl-8" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setMasquerPerdus((v) => !v)}>
              {masquerPerdus ? <Eye /> : <EyeOff />} {masquerPerdus ? "Afficher" : "Masquer"} les perdus
            </Button>
            <Button size="sm" onClick={() => setNouveau(true)}><Plus /> Prospect</Button>
          </>
        }
      />
      <DndContext id="pipeline-kanban" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActif(null)}>
        <div className="scroll-fin -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6" style={{ height: "calc(100dvh - 10rem)" }}>
          {colonnes.map((e) => {
            const items = filtres.filter((h) => h.etape_id === e.id);
            return (
              <Colonne key={e.id} etape={e} hotels={items}>
                {items.map((h) => (
                  <CarteDraggable key={h.id} h={h} etapes={etapes} onSuivante={(id) => demander(h.id, h.nom, id)} />
                ))}
              </Colonne>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>{actif && <Carte h={actif} etapes={etapes} enDrag />}</DragOverlay>
      </DndContext>
      <HotelForm ouvert={nouveau} onOpenChange={setNouveau} etapes={etapes} listes={listes} onEnregistre={() => router.refresh()} />
      {dialog}
    </div>
  );
}
