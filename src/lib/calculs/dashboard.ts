import { addMonths, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { PARIS } from "@/lib/dates";
import type { ActiviteQuotidienne, ClientVue, HotelVue, MetriqueObjectif, Objectif } from "@/lib/types";

export interface RelanceKpi { type: string; statut: string; date_prevue: string }

/** Objectif applicable : celui du mois s'il existe, sinon l'objectif par défaut. */
export function objectifPour(objectifs: Objectif[], metrique: MetriqueObjectif, mois: Date = new Date()) {
  const cle = format(startOfMonth(mois, PARIS), "yyyy-MM-dd", PARIS);
  const periode = ["linkedin", "appels", "emails"].includes(metrique) ? "quotidien" : "mensuel";
  return (
    objectifs.find((o) => o.metrique === metrique && o.periode === periode && o.mois === cle)?.valeur_cible ??
    objectifs.find((o) => o.metrique === metrique && o.periode === periode && !o.mois)?.valeur_cible ??
    0
  );
}

const dansMois = (d: string | null | undefined, ref: Date) => !!d && format(new Date(d), "yyyy-MM", PARIS) === format(ref, "yyyy-MM", PARIS);

export function calculerKpis(
  hotels: HotelVue[],
  relances: RelanceKpi[],
  clients: ClientVue[],
  maintenant = new Date(),
) {
  const actifs = hotels.filter((h) => h.etape_code !== "gagne" && h.etape_code !== "perdu");
  const gagnes = hotels.filter((h) => h.etape_code === "gagne").length;
  const perdus = hotels.filter((h) => h.etape_code === "perdu").length;
  const debutSemaine = startOfWeek(maintenant, { weekStartsOn: 1, ...PARIS });
  const finSemaine = endOfWeek(maintenant, { weekStartsOn: 1, ...PARIS });
  const rdvSemaine = relances.filter((r) => {
    const d = new Date(r.date_prevue);
    return r.type === "rdv" && r.statut !== "annule" && d >= debutSemaine && d <= finSemaine;
  }).length;
  const clientsActifs = clients.filter((c) => c.statut === "actif");
  const signesMois = clients.filter((c) => dansMois(c.date_signature, maintenant));

  return {
    prospectsActifs: actifs.length,
    rdvSemaine,
    tauxConversion: gagnes + perdus > 0 ? (gagnes / (gagnes + perdus)) * 100 : 0,
    gagnes,
    perdus,
    caSigneMois: signesMois.reduce((s, c) => s + c.total_setup, 0),
    signaturesMois: signesMois.length,
    caSigneTotal: clients.reduce((s, c) => s + c.total_setup, 0),
    pipelinePondere: actifs.reduce((s, h) => s + h.valeur_ponderee, 0),
    pipelineBrut: actifs.reduce((s, h) => s + h.valeur_annuelle, 0),
    mrr: clientsActifs.reduce((s, c) => s + c.mrr, 0),
  };
}

/** Série mensuelle sur n mois : prospects ajoutés, RDV obtenus, signatures. */
export function serieMensuelle(hotels: Pick<HotelVue, "created_at">[], relances: RelanceKpi[], clients: Pick<ClientVue, "date_signature">[], n = 6, maintenant = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const mois = addMonths(startOfMonth(maintenant, PARIS), i - n + 1, PARIS);
    return {
      mois: format(mois, "MMM yy", { locale: fr, ...PARIS }),
      prospects: hotels.filter((h) => dansMois(h.created_at, mois)).length,
      rdv: relances.filter((r) => r.type === "rdv" && r.statut !== "annule" && dansMois(r.date_prevue, mois)).length,
      signatures: clients.filter((c) => dansMois(c.date_signature, mois)).length,
    };
  });
}

export function activiteDuJour(activites: ActiviteQuotidienne[], jour: string) {
  return activites.find((a) => a.date === jour) ?? { linkedin: 0, appels: 0, emails: 0 };
}
