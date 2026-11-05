"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { enregistrerContact, supprimerContact, type ContactSaisie } from "@/lib/actions/hotels";
import { POSTES, ROLES_DECISION } from "@/lib/constantes";
import type { Contact, Poste, RoleDecision } from "@/lib/types";
import { initiales } from "@/lib/utils";
import { ActionsRapides } from "./actions-rapides";

export function Contacts({ hotelId, contacts }: { hotelId: string; contacts: Contact[] }) {
  const router = useRouter();
  const [edition, setEdition] = useState<Contact | "nouveau" | null>(null);
  const [, startTransition] = useTransition();

  const supprimer = (c: Contact) =>
    startTransition(async () => {
      const r = await supprimerContact(c.id, hotelId);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success("Contact supprimé");
      router.refresh();
    });

  const definirPrincipal = (c: Contact) =>
    startTransition(async () => {
      const r = await enregistrerContact({ hotel_id: hotelId, est_principal: true }, c.id);
      if (!r.ok) return void toast.error(r.erreur);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        <CardAction>
          <Button variant="ghost" size="xs" onClick={() => setEdition("nouveau")}><Plus /> Ajouter</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        {contacts.length === 0 && <p className="text-sm text-muted-foreground">Aucun contact pour l&apos;instant.</p>}
        {contacts.map((c) => {
          const nom = [c.prenom, c.nom].filter(Boolean).join(" ") || "Sans nom";
          return (
            <div key={c.id} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{initiales(nom)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{nom}</span>
                  {c.est_principal && <Star className="size-3 fill-amber-500 text-amber-500" aria-label="Contact principal" />}
                  {c.role_decision && (
                    <Badge variant={c.role_decision === "decideur" ? "default" : "secondary"} className="text-[10px]">
                      {ROLES_DECISION[c.role_decision]}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {[c.poste ? POSTES[c.poste] : null, c.email, c.telephone].filter(Boolean).join(" · ") || "—"}
                </p>
                <ActionsRapides telephone={c.telephone} email={c.email} linkedin={c.linkedin} className="-ml-1.5 mt-0.5" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" aria-label={`Actions pour ${nom}`}><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEdition(c)}><Pencil /> Modifier</DropdownMenuItem>
                  {!c.est_principal && <DropdownMenuItem onSelect={() => definirPrincipal(c)}><Star /> Contact principal</DropdownMenuItem>}
                  <DropdownMenuItem variant="destructive" onSelect={() => supprimer(c)}><Trash2 /> Supprimer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </CardContent>
      <ContactDialog
        hotelId={hotelId}
        contact={edition === "nouveau" ? null : edition}
        ouvert={edition !== null}
        onOpenChange={(o) => !o && setEdition(null)}
      />
    </Card>
  );
}

function ContactDialog({ hotelId, contact, ouvert, onOpenChange }: { hotelId: string; contact: Contact | null; ouvert: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [f, setF] = useState<ContactSaisie>({ hotel_id: hotelId });
  const [cle, setCle] = useState<string | null>(null);
  const idCourant = contact?.id ?? "nouveau";
  if (ouvert && cle !== idCourant) {
    setCle(idCourant);
    setF(contact ? { ...contact, hotel_id: hotelId } : { hotel_id: hotelId, role_decision: "decideur", poste: "directeur" });
  }
  if (!ouvert && cle !== null) setCle(null);

  const set = <K extends keyof ContactSaisie>(k: K, v: ContactSaisie[K]) => setF((p) => ({ ...p, [k]: v }));

  const valider = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await enregistrerContact(f, contact?.id);
      if (!r.ok) return void toast.error(r.erreur);
      toast.success(contact ? "Contact modifié" : "Contact ajouté");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact ? "Modifier le contact" : "Nouveau contact"}</DialogTitle>
        </DialogHeader>
        <form id="form-contact" onSubmit={valider} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="c-prenom">Prénom</Label><Input id="c-prenom" autoFocus value={f.prenom ?? ""} onChange={(e) => set("prenom", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="c-nom">Nom</Label><Input id="c-nom" value={f.nom ?? ""} onChange={(e) => set("nom", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Poste</Label>
              <Select value={f.poste ?? ""} onValueChange={(v) => set("poste", v as Poste)}>
                <SelectTrigger aria-label="Poste"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>{Object.entries(POSTES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Rôle dans la décision</Label>
              <Select value={f.role_decision ?? ""} onValueChange={(v) => set("role_decision", v as RoleDecision)}>
                <SelectTrigger aria-label="Rôle dans la décision"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>{Object.entries(ROLES_DECISION).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="c-tel">Téléphone</Label><Input id="c-tel" type="tel" value={f.telephone ?? ""} onChange={(e) => set("telephone", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="c-li">LinkedIn</Label><Input id="c-li" value={f.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/…" /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="c-notes">Notes</Label><Textarea id="c-notes" value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="submit" form="form-contact" disabled={enCours}>{enCours && <Loader2 className="animate-spin" />}Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
