import { createClient } from "@supabase/supabase-js";

/** Recharge les données de démo du compte de test (état connu avant chaque fichier de tests). */
export async function rechargerDemo() {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { error } = await s.auth.signInWithPassword({ email: process.env.E2E_EMAIL!, password: process.env.E2E_PASSWORD! });
  if (error) throw error;
  const { error: e2 } = await s.rpc("charger_donnees_demo");
  if (e2) throw e2;
  // Objectifs ajustés pour un mois précis : on revient aux valeurs par défaut
  await s.from("objectifs").delete().not("mois", "is", null);
}
