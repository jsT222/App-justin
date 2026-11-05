import { differenceInCalendarMonths } from "date-fns";
import type { ClientAutomatisation } from "@/lib/types";

/** Nombre de mensualités facturées depuis la mise en service (mois entamés, mois de mise en service inclus). */
export function moisFactures(dateMiseEnService: string | null, maintenant = new Date()) {
  if (!dateMiseEnService) return 0;
  const d = new Date(dateMiseEnService);
  if (d > maintenant) return 0;
  return differenceInCalendarMonths(maintenant, d) + 1;
}

/** CA total d'un ensemble d'automatisations : mises en place + maintenances facturées. */
export function caTotal(autos: Pick<ClientAutomatisation, "prix_setup" | "prix_mensuel" | "date_mise_en_service" | "statut">[], maintenant = new Date()) {
  return autos.reduce(
    (s, a) => s + Number(a.prix_setup) + (a.statut === "arretee" ? 0 : Number(a.prix_mensuel) * moisFactures(a.date_mise_en_service, maintenant)),
    0,
  );
}

export function mrr(autos: Pick<ClientAutomatisation, "prix_mensuel" | "statut">[]) {
  return autos.filter((a) => a.statut === "en_production").reduce((s, a) => s + Number(a.prix_mensuel), 0);
}
