import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FicheClient } from "@/components/clients/fiche-client";
import { getOffres, normaliserNombres } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { ClientAutomatisation, ClientVue, Interaction } from "@/lib/types";

export const metadata: Metadata = { title: "Client" };

export default async function PageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await getSession();
  const { data: c } = await supabase.from("v_clients").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [autos, interactions, offres, contact] = await Promise.all([
    supabase.from("client_automatisations").select("*").eq("client_id", id).order("created_at"),
    supabase.from("interactions").select("*").eq("hotel_id", c.hotel_id!).order("date", { ascending: false }).limit(100),
    getOffres(),
    supabase.from("contacts").select("telephone, email, linkedin").eq("hotel_id", c.hotel_id!).order("est_principal", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return (
    <FicheClient
      client={normaliserNombres([c])[0] as ClientVue}
      automatisations={normaliserNombres(autos.data ?? []) as ClientAutomatisation[]}
      interactions={(interactions.data ?? []) as Interaction[]}
      offres={offres}
      contact={contact.data}
    />
  );
}
