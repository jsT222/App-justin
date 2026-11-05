import { describe, expect, it } from "vitest";
import { cleDoublon, euros, normaliser, telHref, urlExterne } from "@/lib/utils";

describe("utilitaires", () => {
  it("normalise comme la fonction SQL (accents, casse, ponctuation)", () => {
    expect(normaliser("Hôtel Côté-Sud")).toBe("hotelcotesud");
    expect(cleDoublon("HOTEL côté sud", "Cannes")).toBe(cleDoublon("Hôtel Côté-Sud", "cannes"));
  });
  it("formate les euros en français", () => {
    expect(euros(12500).replace(/\s/g, " ")).toBe("12 500 €");
  });
  it("prépare les liens externes", () => {
    expect(urlExterne("exemple.fr")).toBe("https://exemple.fr");
    expect(urlExterne("http://a.fr")).toBe("http://a.fr");
    expect(urlExterne("  ")).toBeNull();
    expect(telHref("04 94 00 11 22")).toBe("tel:0494001122");
  });
});

import { aujourdhuiParis, isoParis } from "@/lib/dates";

describe("dates (heure de Paris)", () => {
  it("convertit 9 h Paris en UTC selon l'heure d'hiver / d'été", () => {
    expect(isoParis("2026-11-20", 9)).toBe("2026-11-20T08:00:00.000Z");
    expect(isoParis("2026-07-14", 9)).toBe("2026-07-14T07:00:00.000Z");
  });
  it("donne la date du jour à Paris", () => {
    expect(aujourdhuiParis(new Date("2026-11-05T23:30:00Z"))).toBe("2026-11-06");
  });
});

import { remplirModele } from "@/lib/modeles";

describe("modèles de messages", () => {
  it("remplit les variables connues et laisse les autres", () => {
    expect(remplirModele("Bonjour {prenom}, {nom_hotel} à {ville} ({inconnue})", { prenom: "Claire", nom_hotel: "Villa Mimosa", ville: "Antibes" }))
      .toBe("Bonjour Claire, Villa Mimosa à Antibes ({inconnue})");
    expect(remplirModele("{prenom}", { prenom: "" })).toBe("{prenom}");
    expect(remplirModele("{etoiles} étoiles", { etoiles: 4 })).toBe("4 étoiles");
  });
});
