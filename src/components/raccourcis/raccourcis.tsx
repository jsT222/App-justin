"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Building2, CalendarPlus, Bell, FileText, Keyboard, Moon, Phone, Plus, Search, StickyNote, Sun } from "lucide-react";
import { HotelForm } from "@/components/hotel/hotel-form";
import { RelanceDialog, type HotelOption } from "@/components/hotel/relance-dialog";
import { Composeur } from "@/components/hotel/timeline";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { incrementerActivite } from "@/lib/actions/activite";
import type { Listes } from "@/lib/data";
import { NAVIGATION } from "@/lib/navigation";
import type { Etape, TypeInteraction } from "@/lib/types";
import { useHotkeys } from "./use-hotkeys";
import { toast } from "sonner";

interface Ctx {
  ouvrirPalette: () => void;
  nouveauProspect: () => void;
  nouvelleRelance: (type?: "appel" | "rdv") => void;
  nouvelleNote: (type?: TypeInteraction) => void;
  aide: () => void;
}
const RaccourcisCtx = createContext<Ctx | null>(null);
export const useRaccourcis = () => useContext(RaccourcisCtx)!;

const LISTE_RACCOURCIS: [string, string][] = [
  ["Ctrl/⌘ K", "Palette de commandes"],
  ["/", "Recherche rapide"],
  ["N", "Nouveau prospect"],
  ["R", "Nouvelle relance"],
  ["G puis D", "Aller au Dashboard"],
  ["G puis P", "Aller au Pipeline"],
  ["G puis L", "Aller à la liste des prospects"],
  ["G puis A", "Aller à l'Agenda"],
  ["G puis C", "Aller aux Clients"],
  ["E", "Éditer la fiche ouverte"],
  ["Ctrl/⌘ Entrée", "Enregistrer la note"],
  ["?", "Afficher cette aide"],
];

export function Raccourcis({ hotels, etapes, listes, children }: { hotels: HotelOption[]; etapes: Etape[]; listes: Listes; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [palette, setPalette] = useState(false);
  const [prospect, setProspect] = useState(false);
  const [relance, setRelance] = useState<"appel" | "rdv" | null>(null);
  const [note, setNote] = useState<TypeInteraction | null>(null);
  const [noteHotel, setNoteHotel] = useState("");
  const [aide, setAide] = useState(false);

  const hotelCourant = pathname.match(/^\/prospects\/([0-9a-f-]{36})/)?.[1];

  const ctx = useMemo<Ctx>(
    () => ({
      ouvrirPalette: () => setPalette(true),
      nouveauProspect: () => setProspect(true),
      nouvelleRelance: (t = "appel") => setRelance(t),
      nouvelleNote: (t = "note") => { setNoteHotel(hotelCourant ?? ""); setNote(t); },
      aide: () => setAide(true),
    }),
    [hotelCourant],
  );

  const aller = (href: string) => () => router.push(href);
  useHotkeys([
    { touches: "mod+k", action: () => setPalette((o) => !o), partout: true },
    { touches: "n", action: () => setProspect(true) },
    { touches: "r", action: () => setRelance("appel") },
    { touches: "?", action: () => setAide(true) },
    {
      touches: "/",
      action: () => {
        const champ = document.querySelector<HTMLInputElement>("#recherche-prospects");
        if (champ) champ.focus();
        else setPalette(true);
      },
    },
    { touches: "g d", action: aller("/dashboard") },
    { touches: "g p", action: aller("/pipeline") },
    { touches: "g l", action: aller("/prospects") },
    { touches: "g a", action: aller("/agenda") },
    { touches: "g c", action: aller("/clients") },
  ]);

  const executer = (fn: () => void) => () => { setPalette(false); fn(); };

  return (
    <RaccourcisCtx.Provider value={ctx}>
      {children}

      <CommandDialog open={palette} onOpenChange={setPalette}>
        <CommandInput placeholder="Rechercher un hôtel, une page, une action…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={executer(() => setProspect(true))}><Building2 /> Nouveau prospect<CommandShortcut>N</CommandShortcut></CommandItem>
            <CommandItem onSelect={executer(() => setRelance("appel"))}><Bell /> Nouvelle relance<CommandShortcut>R</CommandShortcut></CommandItem>
            <CommandItem onSelect={executer(() => setRelance("rdv"))}><CalendarPlus /> Nouveau rendez-vous</CommandItem>
            <CommandItem onSelect={executer(() => ctx.nouvelleNote("note"))}><StickyNote /> Ajouter une note</CommandItem>
            <CommandItem onSelect={executer(() => router.push("/propositions/nouvelle"))}><FileText /> Nouvelle proposition</CommandItem>
            <CommandItem onSelect={executer(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>{resolvedTheme === "dark" ? <Sun /> : <Moon />} Basculer le thème</CommandItem>
            <CommandItem onSelect={executer(() => setAide(true))}><Keyboard /> Raccourcis clavier<CommandShortcut>?</CommandShortcut></CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Aller à">
            {NAVIGATION.map((n) => (
              <CommandItem key={n.href} value={`Aller ${n.titre}`} onSelect={executer(() => router.push(n.href))}>
                <n.icone /> {n.titre}{n.raccourci && <CommandShortcut>G {n.raccourci}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Hôtels">
            {hotels.map((h) => (
              <CommandItem key={h.id} value={`${h.nom} ${h.ville ?? ""} ${h.id}`} onSelect={executer(() => router.push(`/prospects/${h.id}`))}>
                <Search /> {h.nom} <span className="text-muted-foreground">{h.ville}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <HotelForm ouvert={prospect} onOpenChange={setProspect} etapes={etapes} listes={listes} onEnregistre={(id) => router.push(`/prospects/${id}`)} />
      <RelanceDialog ouvert={!!relance} onOpenChange={(o) => !o && setRelance(null)} hotelId={hotelCourant} hotels={hotels} typeInitial={relance ?? "appel"} />

      <Dialog open={!!note} onOpenChange={(o) => !o && setNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Noter un échange</DialogTitle>
            <DialogDescription>Juste après un appel, pendant que c&apos;est frais.</DialogDescription>
          </DialogHeader>
          {!hotelCourant && (
            <div className="grid gap-1.5">
              <Label>Hôtel</Label>
              <Select value={noteHotel} onValueChange={setNoteHotel}>
                <SelectTrigger aria-label="Hôtel de la note"><SelectValue placeholder="Choisir un hôtel…" /></SelectTrigger>
                <SelectContent>{hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.nom}{h.ville ? ` — ${h.ville}` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {noteHotel ? <Composeur key={`${noteHotel}-${note}`} hotelId={noteHotel} typeInitial={note ?? "note"} compact autoFocus onEnvoye={() => setNote(null)} /> : <p className="text-sm text-muted-foreground">Choisis d&apos;abord l&apos;hôtel.</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={aide} onOpenChange={setAide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Raccourcis clavier</DialogTitle></DialogHeader>
          <dl className="grid gap-1.5 text-sm">
            {LISTE_RACCOURCIS.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{v}</dt>
                <dd className="flex gap-1">{k.split(" ").map((p) => (p === "puis" ? <span key={p} className="text-xs text-muted-foreground">puis</span> : <kbd key={p} className="rounded border bg-muted px-1.5 py-0.5 text-xs">{p}</kbd>))}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>

      <BoutonFlottant />
      <BarreMobile />
    </RaccourcisCtx.Provider>
  );
}

function BoutonFlottant() {
  const r = useRaccourcis();
  return (
    <div className="fixed right-6 bottom-6 z-40 hidden lg:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="size-12 rounded-full shadow-lg" aria-label="Ajouter"><Plus className="size-5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-52">
          <DropdownMenuItem onSelect={r.nouveauProspect}><Building2 /> Prospect<DropdownMenuShortcut>N</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => r.nouvelleNote("note")}><StickyNote /> Note</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => r.nouvelleRelance("appel")}><Bell /> Relance<DropdownMenuShortcut>R</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => r.nouvelleRelance("rdv")}><CalendarPlus /> Rendez-vous</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function BarreMobile() {
  const r = useRaccourcis();
  const bouton = (label: string, Icone: React.ComponentType<{ className?: string }>, onClick: () => void) => (
    <button onClick={onClick} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground active:bg-accent">
      <Icone className="size-5 text-foreground" /> {label}
    </button>
  );
  return (
    <nav aria-label="Actions rapides" className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {bouton("Noter l'appel", Phone, () => r.nouvelleNote("appel"))}
      {bouton("+1 appel", Plus, async () => {
        const res = await incrementerActivite("appels");
        if (res.ok) toast.success(`Appels aujourd'hui : ${res.data.appels}`);
        else toast.error(res.erreur);
      })}
      {bouton("Relance", Bell, () => r.nouvelleRelance("appel"))}
      {bouton("Prospect", Building2, r.nouveauProspect)}
      {bouton("Rechercher", Search, r.ouvrirPalette)}
    </nav>
  );
}
