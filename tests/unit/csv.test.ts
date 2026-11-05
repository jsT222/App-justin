import { describe, expect, it } from "vitest";
import { analyserDoublons, convertirLigne, devinerCorrespondance, devinerPoste, versNombre } from "@/lib/csv";
import { cleDoublon } from "@/lib/utils";

describe("import CSV", () => {
  it("devine les colonnes d'un export Google Maps", () => {
    const c = devinerCorrespondance(["title", "address", "city", "phone", "website", "totalScore", "reviewsCount", "url"]);
    expect(c.nom).toBe("title");
    expect(c.ville).toBe("city");
    expect(c.contact_telephone).toBe("phone");
    expect(c.site_web).toBe("website");
    expect(c.note_google).toBe("totalScore");
    expect(c.nb_avis_google).toBe("reviewsCount");
  });

  it("devine les colonnes d'un export LinkedIn", () => {
    const c = devinerCorrespondance(["First Name", "Last Name", "Company", "Job Title", "Email Address", "Profile URL", "Location"]);
    expect(c.contact_prenom).toBe("First Name");
    expect(c.contact_nom).toBe("Last Name");
    expect(c.nom).toBe("Company");
    expect(c.contact_poste).toBe("Job Title");
    expect(c.contact_email).toBe("Email Address");
    expect(c.contact_linkedin).toBe("Profile URL");
    expect(c.ville).toBe("Location");
  });

  it("convertit les nombres au format français", () => {
    expect(versNombre("4,5")).toBe(4.5);
    expect(versNombre("1 234 avis")).toBe(1234);
    expect(versNombre("")).toBeNull();
  });

  it("devine le poste", () => {
    expect(devinerPoste("Directeur général")).toBe("directeur");
    expect(devinerPoste("Owner")).toBe("proprietaire");
    expect(devinerPoste("Revenue Manager")).toBe("revenue_manager");
  });

  it("convertit une ligne et déduit la ville de l'adresse", () => {
    const l = convertirLigne(
      { Nom: "Hôtel Test", Adresse: "12 rue du Port, 83150 Bandol", Note: "4,2", Contact: "Marie Dupont" },
      { nom: "Nom", adresse: "Adresse", note_google: "Note", contact_nom_complet: "Contact" },
      { source: "Google Maps" },
    );
    expect(l?.hotel.ville).toBe("Bandol");
    expect(l?.hotel.code_postal).toBe("83150");
    expect(l?.hotel.note_google).toBe(4.2);
    expect(l?.hotel.source).toBe("Google Maps");
    expect(l?.contact?.prenom).toBe("Marie");
    expect(l?.contact?.nom).toBe("Dupont");
  });

  it("ignore les lignes sans nom", () => {
    expect(convertirLigne({ Nom: "  " }, { nom: "Nom" }, {})).toBeNull();
  });

  it("détecte les doublons avec la base et dans le fichier", () => {
    const lignes = [
      { hotel: { nom: "Villa Mimosa", ville: "Antibes" } },
      { hotel: { nom: "Nouvel Hôtel", ville: "Nice" } },
      { hotel: { nom: "NOUVEL HOTEL", ville: "nice" } },
    ];
    const res = analyserDoublons(lignes, new Set([cleDoublon("Villa Mimosa", "Antibes")]));
    expect(res.map((r) => r.doublon)).toEqual(["existant", null, "fichier"]);
  });
});
