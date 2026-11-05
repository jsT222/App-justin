"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/server";
import type { MetriqueObjectif } from "@/lib/types";

const QUOTIDIENS: MetriqueObjectif[] = ["linkedin", "appels", "emails"];

/** Définit un objectif (mois = « AAAA-MM-01 » pour un mois précis, null pour la valeur par défaut). */
export async function definirObjectifs(valeurs: Partial<Record<MetriqueObjectif, number>>, mois: string | null) {
  const { supabase } = await getSession();
  for (const [metrique, valeur] of Object.entries(valeurs) as [MetriqueObjectif, number][]) {
    if (valeur == null || Number.isNaN(valeur)) continue;
    const periode = QUOTIDIENS.includes(metrique) ? "quotidien" : "mensuel";
    let q = supabase.from("objectifs").select("id").eq("metrique", metrique).eq("periode", periode);
    q = mois ? q.eq("mois", mois) : q.is("mois", null);
    const { data: existant } = await q.maybeSingle();
    const { error } = existant
      ? await supabase.from("objectifs").update({ valeur_cible: valeur }).eq("id", existant.id)
      : await supabase.from("objectifs").insert({ metrique, periode, valeur_cible: valeur, mois });
    if (error) return { ok: false as const, erreur: error.message };
  }
  revalidatePath("/objectifs");
  revalidatePath("/dashboard");
  revalidatePath("/parametres");
  return { ok: true as const };
}
