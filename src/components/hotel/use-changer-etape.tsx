"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changerEtape } from "@/lib/actions/hotels";
import type { Etape } from "@/lib/types";
import { DialogPerdu, type InfosPerte } from "./dialog-perdu";

/**
 * Change l'étape d'un hôtel. Pour « Perdu », ouvre d'abord la saisie de la raison.
 * Renvoie la fonction à appeler + l'élément de dialogue à rendre.
 */
export function useChangerEtape(etapes: Etape[], options?: { onOptimiste?: (hotelId: string, etapeId: string) => void; onAnnule?: () => void }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [perte, setPerte] = useState<{ hotelId: string; nom: string; etapeId: string } | null>(null);

  const executer = (hotelId: string, etapeId: string, infos?: InfosPerte) => {
    const etape = etapes.find((e) => e.id === etapeId);
    options?.onOptimiste?.(hotelId, etapeId);
    startTransition(async () => {
      const r = await changerEtape(hotelId, etapeId, infos);
      if (!r.ok) {
        toast.error(r.erreur);
        options?.onAnnule?.();
      } else if (etape?.code === "gagne") {
        toast.success("Affaire gagnée ! La fiche client a été créée.", {
          action: { label: "Voir les clients", onClick: () => router.push("/clients") },
        });
      } else {
        toast.success(`Étape : ${etape?.nom}`);
      }
      router.refresh();
    });
  };

  const demander = (hotelId: string, nom: string, etapeId: string) => {
    const etape = etapes.find((e) => e.id === etapeId);
    if (etape?.code === "perdu") setPerte({ hotelId, nom, etapeId });
    else executer(hotelId, etapeId);
  };

  const dialog = (
    <DialogPerdu
      key={perte?.hotelId ?? "aucun"}
      ouvert={!!perte}
      nomHotel={perte?.nom ?? ""}
      onAnnuler={() => {
        setPerte(null);
        options?.onAnnule?.();
      }}
      onValider={(infos) => {
        if (perte) executer(perte.hotelId, perte.etapeId, infos);
        setPerte(null);
      }}
    />
  );

  return { demander, dialog };
}
