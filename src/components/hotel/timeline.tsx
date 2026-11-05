"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, CalendarCheck, Loader2, Mail, MessageCircle, Phone, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LinkedinIcon } from "@/components/icones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ajouterInteraction, supprimerInteraction } from "@/lib/actions/hotels";
import { TYPES_INTERACTION } from "@/lib/constantes";
import { dateHeure, depuis } from "@/lib/dates";
import type { Interaction, TypeInteraction } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONES: Record<TypeInteraction, React.ComponentType<{ className?: string }>> = {
  note: StickyNote,
  appel: Phone,
  email: Mail,
  linkedin: LinkedinIcon,
  whatsapp: MessageCircle,
  rdv: CalendarCheck,
  changement_etape: ArrowRightLeft,
};

const TYPES_SAISIE: TypeInteraction[] = ["note", "appel", "email", "linkedin", "whatsapp", "rdv"];

export function Composeur({ hotelId, compact, onEnvoye }: { hotelId: string; compact?: boolean; onEnvoye?: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<TypeInteraction>("note");
  const [texte, setTexte] = useState("");
  const [enCours, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  const envoyer = () => {
    if (!texte.trim() && type === "note") return;
    startTransition(async () => {
      const r = await ajouterInteraction(hotelId, type, texte || TYPES_INTERACTION[type]);
      if (!r.ok) return void toast.error(r.erreur);
      setTexte("");
      toast.success(type === "note" ? "Note ajoutée" : `${TYPES_INTERACTION[type]} enregistré`);
      onEnvoye?.();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Type d'échange">
        {TYPES_SAISIE.map((t) => {
          const Icone = ICONES[t];
          return (
            <Button key={t} type="button" size="xs" role="radio" aria-checked={type === t} variant={type === t ? "secondary" : "ghost"} onClick={() => setType(t)}>
              <Icone className="size-3.5" />
              {TYPES_INTERACTION[t]}
            </Button>
          );
        })}
      </div>
      <Textarea
        ref={ref}
        id="composeur-note"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            envoyer();
          }
        }}
        placeholder={type === "note" ? "Ajouter une note…" : "Résumé de l'échange (optionnel)…"}
        aria-label="Contenu de l'échange"
        className={cn("min-h-20", compact && "min-h-16")}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground"><kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Entrée</kbd> pour enregistrer</span>
        <Button size="sm" onClick={envoyer} disabled={enCours || (type === "note" && !texte.trim())}>
          {enCours && <Loader2 className="animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

export function Timeline({ hotelId, interactions }: { hotelId: string; interactions: Interaction[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const supprimer = (id: string) =>
    startTransition(async () => {
      const r = await supprimerInteraction(id, hotelId);
      if (!r.ok) return void toast.error(r.erreur);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Échanges et notes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Composeur hotelId={hotelId} />
        <ol className="relative grid gap-4 border-l pl-5">
          {interactions.length === 0 && <li className="text-sm text-muted-foreground">Aucun échange pour l&apos;instant.</li>}
          {interactions.map((i) => {
            const Icone = ICONES[i.type];
            const systeme = i.type === "changement_etape";
            return (
              <li key={i.id} className="group relative">
                <span className="absolute top-0.5 -left-[29px] flex size-4.5 items-center justify-center rounded-full border bg-background">
                  <Icone className="size-2.5 text-muted-foreground" />
                </span>
                <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{TYPES_INTERACTION[i.type]}</span>
                  <span title={dateHeure(i.date)}>{depuis(i.date)}</span>
                  {!systeme && (
                    <button onClick={() => supprimer(i.id)} aria-label="Supprimer" className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                {i.contenu && <p className={cn("mt-0.5 text-sm whitespace-pre-wrap", systeme && "text-muted-foreground")}>{i.contenu}</p>}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
