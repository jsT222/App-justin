import type { Metadata } from "next";
import { addMonths, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { tz } from "@date-fns/tz";
import { Agenda } from "@/components/agenda/agenda";
import { FUSEAU } from "@/lib/dates";
import { getSession } from "@/lib/supabase/server";
import type { RelanceAvecHotel } from "@/lib/types";

export const metadata: Metadata = { title: "Agenda" };

export default async function PageAgenda({ searchParams }: { searchParams: Promise<{ mois?: string; vue?: string }> }) {
  const { mois, vue } = await searchParams;
  const { supabase } = await getSession();
  const opts = { in: tz(FUSEAU) };
  const ref = mois && /^\d{4}-\d{2}$/.test(mois) ? new Date(`${mois}-15T12:00:00Z`) : new Date();
  const debut = startOfWeek(startOfMonth(ref, opts), { weekStartsOn: 1, ...opts });
  const fin = endOfWeek(endOfMonth(ref, opts), { weekStartsOn: 1, ...opts });

  const [calendrier, aFaire, hotels] = await Promise.all([
    supabase
      .from("relances")
      .select("*, hotels(id, nom, ville)")
      .neq("statut", "annule")
      .gte("date_prevue", debut.toISOString())
      .lte("date_prevue", fin.toISOString())
      .order("date_prevue"),
    supabase
      .from("relances")
      .select("*, hotels(id, nom, ville)")
      .eq("statut", "a_faire")
      .lte("date_prevue", addMonths(new Date(), 3).toISOString())
      .order("date_prevue"),
    supabase.from("hotels").select("id, nom, ville").order("nom"),
  ]);

  return (
    <Agenda
      mois={ref.toISOString()}
      vue={vue === "calendrier" ? "calendrier" : "liste"}
      calendrier={(calendrier.data ?? []) as RelanceAvecHotel[]}
      aFaire={(aFaire.data ?? []) as RelanceAvecHotel[]}
      hotels={hotels.data ?? []}
    />
  );
}
