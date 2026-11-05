import type { Metadata } from "next";
import { PageEntete } from "@/components/layout/page-entete";
import { Parametres } from "@/components/parametres/parametres";
import { objectifPour } from "@/lib/calculs/dashboard";
import { getEtapes, normaliserNombres } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { ListeValeur, Objectif, Profil } from "@/lib/types";

export const metadata: Metadata = { title: "Paramètres" };

export default async function PageParametres() {
  const { supabase, user } = await getSession();
  const [profil, etapes, listes, objectifs, nbHotels] = await Promise.all([
    supabase.from("profils").select("*").eq("user_id", user.id).maybeSingle(),
    getEtapes(),
    supabase.from("listes_valeurs").select("id, categorie, valeur, ordre").order("ordre"),
    supabase.from("objectifs").select("*").is("mois", null),
    supabase.from("hotels").select("id", { count: "exact", head: true }),
  ]);
  const obj = normaliserNombres(objectifs.data ?? []) as Objectif[];
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageEntete titre="Paramètres" />
      <Parametres
        profil={(profil.data ?? { user_id: user.id }) as Profil}
        etapes={etapes}
        listes={(listes.data ?? []) as ListeValeur[]}
        objectifs={{
          linkedin: objectifPour(obj, "linkedin"), appels: objectifPour(obj, "appels"), emails: objectifPour(obj, "emails"),
          rdv: objectifPour(obj, "rdv"), signatures: objectifPour(obj, "signatures"), ca: objectifPour(obj, "ca"),
        }}
        nbHotels={nbHotels.count ?? 0}
      />
    </div>
  );
}
