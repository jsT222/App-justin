"use client";

import { useEffect, useRef } from "react";

/** Vrai si l'utilisateur tape dans un champ ou si une fenêtre modale est ouverte. */
export function enSaisie(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || !!document.querySelector("[role=dialog], [role=alertdialog], [role=menu]");
}

export interface Raccourci {
  /** « mod+k », « n », « ? », « g d » (séquence) */
  touches: string;
  action: (e: KeyboardEvent) => void;
  /** Autorisé même pendant la saisie (ex. ⌘K) */
  partout?: boolean;
}

/** Gestion des raccourcis simples, avec modificateur et en séquence (G puis D). */
export function useHotkeys(raccourcis: Raccourci[]) {
  const ref = useRef(raccourcis);
  ref.current = raccourcis;
  const prefixe = useRef<{ touche: string; t: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const touche = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      for (const r of ref.current) {
        const parties = r.touches.split(" ");
        if (!r.partout && enSaisie(e)) continue;

        if (parties.length === 2) {
          const p = prefixe.current;
          if (p && p.touche === parties[0] && Date.now() - p.t < 1200 && touche === parties[1] && !mod) {
            e.preventDefault();
            prefixe.current = null;
            r.action(e);
            return;
          }
          continue;
        }

        const [k, besoinMod] = r.touches.startsWith("mod+") ? [r.touches.slice(4), true] : [r.touches, false];
        if (besoinMod !== mod || e.altKey) continue;
        if (touche === k || e.key === k) {
          e.preventDefault();
          prefixe.current = null;
          r.action(e);
          return;
        }
      }

      // Mémorise un éventuel début de séquence (« g »)
      if (!mod && !enSaisie(e) && ref.current.some((r) => r.touches.startsWith(`${touche} `))) {
        prefixe.current = { touche, t: Date.now() };
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
