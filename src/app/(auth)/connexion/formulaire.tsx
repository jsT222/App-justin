"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { connexion, inscription } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormulaireConnexion({ erreurLien }: { erreurLien?: boolean }) {
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  // Champs contrôlés : React 19 réinitialise les formulaires après chaque envoi
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [etatC, actionC, enCoursC] = useActionState(connexion, undefined);
  const [etatI, actionI, enCoursI] = useActionState(inscription, undefined);
  const etat = mode === "connexion" ? etatC : etatI;
  const enCours = mode === "connexion" ? enCoursC : enCoursI;

  return (
    <Card>
      <CardContent>
        <form action={mode === "connexion" ? actionC : actionI} className="grid gap-4">
          {mode === "inscription" && (
            <div className="grid gap-2">
              <Label htmlFor="nom_complet">Nom</Label>
              <Input id="nom_complet" name="nom_complet" placeholder="Justin …" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mot_de_passe">Mot de passe</Label>
            <Input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              required
              minLength={mode === "inscription" ? 8 : undefined}
              autoComplete={mode === "connexion" ? "current-password" : "new-password"}
            />
          </div>
          {erreurLien && !etat && <p className="text-sm text-destructive">Le lien de confirmation est invalide ou expiré.</p>}
          {etat?.erreur && <p role="alert" className="text-sm text-destructive">{etat.erreur}</p>}
          {etat?.message && <p className="text-sm text-success">{etat.message}</p>}
          <Button type="submit" disabled={enCours} className="w-full">
            {enCours && <Loader2 className="animate-spin" />}
            {mode === "connexion" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "connexion" ? "Première utilisation ? " : "Déjà un compte ? "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}
          >
            {mode === "connexion" ? "Créer le compte" : "Se connecter"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
