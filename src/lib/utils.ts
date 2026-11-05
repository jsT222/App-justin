import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurPrecis = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
const nombre = new Intl.NumberFormat("fr-FR");

/** 12 500 € */
export function euros(v: number | string | null | undefined, precis = false) {
  const n = Number(v ?? 0);
  return (precis ? eurPrecis : eur).format(Number.isFinite(n) ? n : 0);
}

export function nb(v: number | null | undefined) {
  return nombre.format(v ?? 0);
}

export function pourcentage(v: number, decimales = 0) {
  return `${v.toFixed(decimales).replace(".", ",")} %`;
}

/** Normalise un texte comme la fonction SQL public.normaliser (détection de doublons). */
export function normaliser(txt: string | null | undefined) {
  return (txt ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function cleDoublon(nom: string | null | undefined, ville: string | null | undefined) {
  return `${normaliser(nom)}|${normaliser(ville)}`;
}

/** Ajoute https:// si absent. */
export function urlExterne(url: string | null | undefined) {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function telHref(tel: string | null | undefined) {
  if (!tel) return null;
  return `tel:${tel.replace(/[^\d+]/g, "")}`;
}

export function initiales(nom: string | null | undefined) {
  if (!nom) return "?";
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
