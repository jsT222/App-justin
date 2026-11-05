import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { tz } from "@date-fns/tz";

export const FUSEAU = "Europe/Paris";
/** Option date-fns : calculs et affichages en heure de Paris, quel que soit le fuseau du serveur. */
export const PARIS = { in: tz(FUSEAU) };

/** Décalage (en minutes) de Paris par rapport à UTC à une date donnée. */
function decalageParis(d: Date) {
  const partie = new Intl.DateTimeFormat("en-US", { timeZone: FUSEAU, timeZoneName: "longOffset" })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")?.value; // ex. « GMT+02:00 »
  const m = partie?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/** « 2026-11-20 » + 9 h → ISO de 9 h heure de Paris. */
export function isoParis(dateJour: string, heure = 9, minute = 0) {
  const approx = new Date(`${dateJour}T12:00:00Z`);
  const off = decalageParis(approx);
  const utc = Date.UTC(
    Number(dateJour.slice(0, 4)),
    Number(dateJour.slice(5, 7)) - 1,
    Number(dateJour.slice(8, 10)),
    heure,
    minute,
  ) - off * 60_000;
  return new Date(utc).toISOString();
}

/** Date du jour à Paris au format AAAA-MM-JJ. */
export function aujourdhuiParis(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).format(d);
}

export function dateCourte(d: string | Date | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "d MMM yyyy", { locale: fr, ...PARIS });
}

export function dateHeure(d: string | Date | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "d MMM à HH:mm", { locale: fr, ...PARIS });
}

/** « Aujourd'hui 14:00 », « Demain », « Hier », « lun. 12 nov. » */
export function dateRelative(d: string | Date | null | undefined, avecHeure = true) {
  if (!d) return "—";
  const date = new Date(d);
  const h = avecHeure ? ` ${format(date, "HH:mm", PARIS)}` : "";
  if (isToday(date, PARIS)) return `Aujourd'hui${h}`;
  if (isTomorrow(date, PARIS)) return `Demain${h}`;
  if (isYesterday(date, PARIS)) return `Hier${h}`;
  return format(date, "EEE d MMM", { locale: fr, ...PARIS }) + h;
}

export function depuis(d: string | Date | null | undefined) {
  if (!d) return "—";
  return formatDistanceToNowStrict(new Date(d), { locale: fr, addSuffix: true });
}

/** En retard = prévue avant le début de la journée en cours. */
export function estEnRetard(d: string | Date | null | undefined) {
  if (!d) return false;
  return new Date(d) < startOfDay(new Date(), PARIS);
}

/** Valeur pour <input type="datetime-local"> */
export function versInputDateHeure(d: string | Date) {
  return format(new Date(d), "yyyy-MM-dd'T'HH:mm");
}
