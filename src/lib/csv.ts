import type { HotelSaisie, LigneImport } from "@/lib/actions/hotels";
import type { Poste } from "@/lib/types";
import { cleDoublon, normaliser } from "@/lib/utils";

/** Champs cibles proposés dans l'écran de correspondance. */
export const CHAMPS_IMPORT = [
  { cle: "nom", label: "Nom de l'hôtel", requis: true },
  { cle: "ville", label: "Ville" },
  { cle: "adresse", label: "Adresse" },
  { cle: "code_postal", label: "Code postal" },
  { cle: "departement", label: "Département" },
  { cle: "site_web", label: "Site web" },
  { cle: "url_booking", label: "Page Booking" },
  { cle: "url_google_maps", label: "Google Maps" },
  { cle: "etoiles", label: "Étoiles" },
  { cle: "nb_chambres", label: "Nombre de chambres" },
  { cle: "note_google", label: "Note Google" },
  { cle: "nb_avis_google", label: "Nombre d'avis Google" },
  { cle: "note_booking", label: "Note Booking" },
  { cle: "nb_avis_booking", label: "Nombre d'avis Booking" },
  { cle: "pms", label: "PMS" },
  { cle: "source", label: "Source" },
  { cle: "contact_prenom", label: "Contact — prénom" },
  { cle: "contact_nom", label: "Contact — nom" },
  { cle: "contact_nom_complet", label: "Contact — nom complet" },
  { cle: "contact_poste", label: "Contact — poste" },
  { cle: "contact_email", label: "Contact — email" },
  { cle: "contact_telephone", label: "Téléphone" },
  { cle: "contact_linkedin", label: "Contact — LinkedIn" },
] as const;

export type ChampImport = (typeof CHAMPS_IMPORT)[number]["cle"];
export type Correspondance = Partial<Record<ChampImport, string>>;

/** Synonymes d'en-têtes (normalisés) : exports LinkedIn / Sales Navigator, Google Sheets, scrapers Google Maps. */
const SYNONYMES: Record<ChampImport, string[]> = {
  nom: ["nom", "nomhotel", "hotel", "etablissement", "name", "title", "titre", "company", "companyname", "entreprise", "societe", "organisation", "organization", "account", "accountname"],
  ville: ["ville", "city", "localite", "commune", "location", "companycity"],
  adresse: ["adresse", "address", "street", "rue", "fulladdress", "adressecomplete"],
  code_postal: ["codepostal", "cp", "postalcode", "zip", "zipcode", "postcode"],
  departement: ["departement", "dept", "region", "state"],
  site_web: ["siteweb", "site", "website", "url", "companywebsite", "web", "domain", "domaine"],
  url_booking: ["booking", "urlbooking", "pagebooking", "bookingurl"],
  url_google_maps: ["googlemaps", "maps", "mapsurl", "urlgooglemaps", "placeurl", "googlemapsurl", "lienmaps"],
  etoiles: ["etoiles", "stars", "categorie", "classement", "hotelclass"],
  nb_chambres: ["chambres", "nbchambres", "nombredechambres", "rooms", "nbrooms", "numberofrooms", "capacite"],
  note_google: ["noteGoogle", "notegoogle", "rating", "note", "totalscore", "googlerating", "avisnote"].map(normaliser),
  nb_avis_google: ["avisgoogle", "nbavisgoogle", "reviews", "reviewscount", "nombredavis", "nbavis", "userratingstotal", "avis"],
  note_booking: ["notebooking", "bookingrating", "bookingscore"],
  nb_avis_booking: ["avisbooking", "nbavisbooking", "bookingreviews"],
  pms: ["pms", "logiciel", "propertymanagementsystem"],
  source: ["source", "origine", "provenance"],
  contact_prenom: ["prenom", "firstname", "givenname"],
  contact_nom: ["nomcontact", "lastname", "familyname", "surname"],
  contact_nom_complet: ["contact", "nomcomplet", "fullname", "contactname", "decideur", "personne"],
  contact_poste: ["poste", "fonction", "jobtitle", "position", "role", "titreposte", "headline"],
  contact_email: ["email", "mail", "courriel", "emailaddress", "adresseemail", "e-mail"].map(normaliser),
  contact_telephone: ["telephone", "tel", "phone", "phonenumber", "mobile", "portable", "numero"],
  contact_linkedin: ["linkedin", "profileurl", "linkedinurl", "profillinkedin", "linkedinprofile", "personlinkedinurl"],
};

/** Propose une colonne source pour chaque champ, d'après les en-têtes du fichier. */
export function devinerCorrespondance(entetes: string[]): Correspondance {
  const res: Correspondance = {};
  const utilisees = new Set<string>();
  const normes = entetes.map((e) => ({ brut: e, n: normaliser(e) }));

  // 1er passage : correspondance exacte ; 2e passage : l'en-tête contient le synonyme
  for (const exact of [true, false]) {
    for (const { cle } of CHAMPS_IMPORT) {
      if (res[cle]) continue;
      const trouve = normes.find(
        ({ brut, n }) => !utilisees.has(brut) && SYNONYMES[cle].some((s) => (exact ? n === s : s.length >= 4 && n.includes(s))),
      );
      if (trouve) {
        res[cle] = trouve.brut;
        utilisees.add(trouve.brut);
      }
    }
  }
  return res;
}

/** « 4,5 » → 4.5 ; « 1 234 avis » → 1234 ; vide → null */
export function versNombre(v: string | undefined | null): number | null {
  if (v == null) return null;
  const s = String(v).replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  return s ? Number(s[0]) : null;
}

function texte(v: string | undefined) {
  const t = (v ?? "").trim();
  return t || undefined;
}

const POSTES: [RegExp, string][] = [
  [/propri|owner|gérant|gerant|fondat|founder/i, "proprietaire"],
  [/revenue|yield/i, "revenue_manager"],
  [/marketing|communication|commercial|sales/i, "marketing"],
  [/r[ée]ception|front ?desk|concierge/i, "reception"],
  [/direct|director|manager|gm\b|ceo|dg\b/i, "directeur"],
];

export function devinerPoste(intitule: string | undefined) {
  if (!intitule) return undefined;
  return POSTES.find(([re]) => re.test(intitule))?.[1] ?? "autre";
}

/** Convertit une ligne brute du CSV en données d'import. */
export function convertirLigne(
  ligne: Record<string, string>,
  corresp: Correspondance,
  defauts: { source?: string; etape_id?: string },
): LigneImport | null {
  const val = (c: ChampImport) => (corresp[c] ? ligne[corresp[c]!] : undefined);
  const nom = texte(val("nom"));
  if (!nom) return null;

  const etoiles = versNombre(val("etoiles"));
  const hotel: HotelSaisie = {
    nom,
    ville: texte(val("ville")),
    adresse: texte(val("adresse")),
    code_postal: texte(val("code_postal")),
    departement: texte(val("departement")),
    site_web: texte(val("site_web")),
    url_booking: texte(val("url_booking")),
    url_google_maps: texte(val("url_google_maps")),
    etoiles: etoiles && etoiles >= 1 && etoiles <= 5 ? Math.round(etoiles) : null,
    nb_chambres: versNombre(val("nb_chambres")),
    note_google: borne(versNombre(val("note_google")), 5),
    nb_avis_google: versNombre(val("nb_avis_google")),
    note_booking: borne(versNombre(val("note_booking")), 10),
    nb_avis_booking: versNombre(val("nb_avis_booking")),
    pms: texte(val("pms")),
    source: texte(val("source")) ?? defauts.source,
    etape_id: defauts.etape_id,
  };

  // Ville déduite de l'adresse si absente (« 12 rue X, 06400 Cannes »)
  if (!hotel.ville && hotel.adresse) {
    const m = hotel.adresse.match(/\b(\d{5})\s+([^,]+)/);
    if (m) {
      hotel.code_postal ??= m[1];
      hotel.ville = m[2].trim();
    }
  }

  let prenom = texte(val("contact_prenom"));
  let nomContact = texte(val("contact_nom"));
  const complet = texte(val("contact_nom_complet"));
  if (complet && !prenom && !nomContact) {
    const [p, ...reste] = complet.split(/\s+/);
    prenom = p;
    nomContact = reste.join(" ") || undefined;
  }
  const posteBrut = texte(val("contact_poste"));
  const contact = {
    prenom,
    nom: nomContact,
    poste: devinerPoste(posteBrut) as Poste | undefined,
    email: texte(val("contact_email")),
    telephone: texte(val("contact_telephone")),
    linkedin: texte(val("contact_linkedin")),
    notes: posteBrut,
  };
  const aContact = contact.prenom || contact.nom || contact.email || contact.telephone || contact.linkedin;
  return { hotel, contact: aContact ? contact : undefined };
}

function borne(n: number | null, max: number) {
  return n == null || n < 0 || n > max ? null : n;
}

export interface LigneAnalysee {
  ligne: LigneImport;
  doublon: "existant" | "fichier" | null;
}

/** Marque les doublons (même nom + même ville) avec la base ou à l'intérieur du fichier. */
export function analyserDoublons(lignes: LigneImport[], clesExistantes: Set<string>): LigneAnalysee[] {
  const vues = new Set<string>();
  return lignes.map((ligne) => {
    const cle = cleDoublon(ligne.hotel.nom, ligne.hotel.ville);
    let doublon: LigneAnalysee["doublon"] = null;
    if (clesExistantes.has(cle)) doublon = "existant";
    else if (vues.has(cle)) doublon = "fichier";
    vues.add(cle);
    return { ligne, doublon };
  });
}
