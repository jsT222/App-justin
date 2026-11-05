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
