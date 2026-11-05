import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { normaliserNombres } from "@/lib/data";
import { PropositionPdf } from "@/lib/pdf/proposition";
import { createClient } from "@/lib/supabase/server";
import type { LigneProposition, Profil, Proposition } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Non authentifié", { status: 401 });

  const { data: p } = await supabase.from("propositions").select("*").eq("id", id).maybeSingle();
  if (!p) return new Response("Introuvable", { status: 404 });
  const [lignes, profil, hotel, contact] = await Promise.all([
    supabase.from("lignes_proposition").select("*").eq("proposition_id", id).order("ordre"),
    supabase.from("profils").select("*").eq("user_id", auth.user.id).maybeSingle(),
    supabase.from("hotels").select("nom, adresse, code_postal, ville").eq("id", p.hotel_id).single(),
    supabase.from("contacts").select("prenom, nom, email").eq("hotel_id", p.hotel_id).order("est_principal", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const buffer = await renderToBuffer(
    createElement(PropositionPdf, {
      proposition: normaliserNombres([p])[0] as Proposition,
      lignes: normaliserNombres(lignes.data ?? []) as LigneProposition[],
      profil: profil.data as Profil | null,
      hotel: hotel.data!,
      contact: contact.data,
    }) as Parameters<typeof renderToBuffer>[0],
  );
  const nomFichier = `${p.numero}-${hotel.data!.nom}`.normalize("NFD").replace(/[^\w-]+/g, "-");
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${nomFichier}.pdf"` },
  });
}
