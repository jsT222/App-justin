import { describe, expect, it } from "vitest";
import { calculerKpis, objectifPour, serieMensuelle } from "@/lib/calculs/dashboard";
import type { ClientVue, HotelVue, Objectif } from "@/lib/types";

const h = (code: string, setup: number, mensuel: number, proba: number, created = "2026-11-02") =>
  ({ etape_code: code, valeur_annuelle: setup + 12 * mensuel, valeur_ponderee: ((setup + 12 * mensuel) * proba) / 100, created_at: created }) as unknown as HotelVue;
const c = (date: string, setup: number, mrr: number, statut = "actif") => ({ date_signature: date, total_setup: setup, mrr, statut }) as unknown as ClientVue;

describe("KPIs du dashboard", () => {
  const maintenant = new Date("2026-11-05T12:00:00");
  const hotels = [h("nouveau", 1000, 100, 10), h("negociation", 5000, 400, 70), h("gagne", 0, 0, 100), h("perdu", 0, 0, 0), h("perdu", 0, 0, 0)];
  const relances = [
    { type: "rdv", statut: "a_faire", date_prevue: "2026-11-06T09:00:00" },
    { type: "rdv", statut: "annule", date_prevue: "2026-11-06T09:00:00" },
    { type: "rdv", statut: "fait", date_prevue: "2026-11-02T09:00:00" },
    { type: "appel", statut: "a_faire", date_prevue: "2026-11-05T09:00:00" },
    { type: "rdv", statut: "a_faire", date_prevue: "2026-11-12T09:00:00" },
  ];
  const clients = [c("2026-11-02", 3700, 240), c("2026-07-01", 2500, 290), c("2026-05-01", 900, 90, "resilie")];
  const k = calculerKpis(hotels, relances, clients, maintenant);

  it("compte prospects actifs et RDV de la semaine (lundi → dimanche)", () => {
    expect(k.prospectsActifs).toBe(2);
    expect(k.rdvSemaine).toBe(2);
  });
  it("calcule le taux de conversion gagnés / (gagnés + perdus)", () => {
    expect(k.tauxConversion).toBeCloseTo(33.33, 1);
  });
  it("calcule le pipeline pondéré (setup + 12 × mensuel) × probabilité", () => {
    expect(k.pipelinePondere).toBeCloseTo((1000 + 1200) * 0.1 + (5000 + 4800) * 0.7);
  });
  it("MRR des clients actifs uniquement, CA signé du mois", () => {
    expect(k.mrr).toBe(530);
    expect(k.caSigneMois).toBe(3700);
    expect(k.caSigneTotal).toBe(7100);
  });
  it("série mensuelle", () => {
    const s = serieMensuelle(hotels, relances, clients, 6, maintenant);
    expect(s).toHaveLength(6);
    expect(s[5]).toMatchObject({ prospects: 5, rdv: 3, signatures: 1 });
  });
  it("objectif du mois prioritaire sur l'objectif par défaut", () => {
    const objectifs = [
      { metrique: "ca", periode: "mensuel", valeur_cible: 6000, mois: null },
      { metrique: "ca", periode: "mensuel", valeur_cible: 9000, mois: "2026-11-01" },
    ] as Objectif[];
    expect(objectifPour(objectifs, "ca", maintenant)).toBe(9000);
    expect(objectifPour(objectifs, "ca", new Date("2026-12-10"))).toBe(6000);
  });
});

import { totauxProposition } from "@/lib/calculs/proposition";

describe("totaux de proposition", () => {
  it("applique la remise à la mise en place uniquement (comme le trigger SQL)", () => {
    const t = totauxProposition(
      [{ quantite: 1, prix_setup: 2500, prix_mensuel: 290 }, { quantite: 1, prix_setup: 1800, prix_mensuel: 150 }, { quantite: 1, prix_setup: 2500, prix_mensuel: 150 }],
      10,
    );
    expect(t.setup).toBe(6120);
    expect(t.mensuel).toBe(590);
    expect(t.remise).toBe(680);
    expect(t.premiereAnnee).toBe(6120 + 12 * 590);
  });
});

import { caTotal, moisFactures, mrr } from "@/lib/calculs/clients";

describe("clients : MRR et CA", () => {
  const ref = new Date("2026-11-05");
  it("compte les mois facturés depuis la mise en service", () => {
    expect(moisFactures("2026-11-01", ref)).toBe(1);
    expect(moisFactures("2026-08-20", ref)).toBe(4);
    expect(moisFactures("2026-12-01", ref)).toBe(0);
    expect(moisFactures(null, ref)).toBe(0);
  });
  it("MRR = automatisations en production ; CA = setups + maintenances facturées", () => {
    const autos = [
      { prix_setup: 2500, prix_mensuel: 290, date_mise_en_service: "2026-08-20", statut: "en_production" as const },
      { prix_setup: 2500, prix_mensuel: 150, date_mise_en_service: null, statut: "en_cours" as const },
    ];
    expect(mrr(autos)).toBe(290);
    expect(caTotal(autos, ref)).toBe(2500 + 4 * 290 + 2500);
  });
});
