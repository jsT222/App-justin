"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/server";

export async function incrementerActivite(metrique: "linkedin" | "appels" | "emails", delta = 1) {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("incrementer_activite", { p_metrique: metrique, p_delta: delta });
  if (error) return { ok: false as const, erreur: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/objectifs");
  return { ok: true as const, data: data as { linkedin: number; appels: number; emails: number } };
}
