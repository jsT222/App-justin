export const VARIABLES = ["nom_hotel", "prenom", "ville", "etoiles", "nb_chambres"] as const;
export type Variables = Partial<Record<(typeof VARIABLES)[number], string | number | null | undefined>>;

/** Remplace {variable} par sa valeur ; les variables inconnues ou vides restent visibles. */
export function remplirModele(texte: string | null | undefined, vars: Variables) {
  return (texte ?? "").replace(/\{(\w+)\}/g, (brut, cle: string) => {
    const v = vars[cle as keyof Variables];
    return v === null || v === undefined || v === "" ? brut : String(v);
  });
}
