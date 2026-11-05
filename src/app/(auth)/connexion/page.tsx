import type { Metadata } from "next";
import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = { title: "Connexion" };

export default async function PageConnexion({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">H</div>
          <h1 className="text-xl font-semibold tracking-tight">Hôtels CRM</h1>
          <p className="text-sm text-muted-foreground">Prospection et suivi clients — automatisation IA</p>
        </div>
        <FormulaireConnexion erreurLien={erreur === "lien"} />
      </div>
    </main>
  );
}
