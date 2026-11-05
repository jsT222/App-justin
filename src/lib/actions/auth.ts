"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatAuth = { erreur?: string; message?: string } | undefined;

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "Email not confirmed": "Confirme d'abord ton adresse email (lien reçu par email).",
  "User already registered": "Un compte existe déjà avec cet email.",
  "Signups not allowed for this instance": "Les inscriptions sont fermées.",
};
const traduire = (m: string) => MESSAGES[m] ?? m;

export async function connexion(_: EtatAuth, formData: FormData): Promise<EtatAuth> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  if (!email || !motDePasse) return { erreur: "Email et mot de passe requis." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { erreur: traduire(error.message) };
  redirect("/dashboard");
}

export async function inscription(_: EtatAuth, formData: FormData): Promise<EtatAuth> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const nom = String(formData.get("nom_complet") ?? "").trim();
  if (!email || motDePasse.length < 8) return { erreur: "Email requis et mot de passe d'au moins 8 caractères." };

  const origine = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { nom_complet: nom || "Justin" }, emailRedirectTo: `${origine}/auth/callback` },
  });
  if (error) return { erreur: traduire(error.message) };
  if (data.session) redirect("/dashboard");
  return { message: "Compte créé. Clique sur le lien reçu par email pour l'activer." };
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
