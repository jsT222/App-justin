"use client";

import { ArrowRight, Globe, Mail, Phone } from "lucide-react";
import { LinkedinIcon as Linkedin } from "@/components/icones";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, telHref, urlExterne } from "@/lib/utils";

interface Props {
  telephone?: string | null;
  email?: string | null;
  linkedin?: string | null;
  site?: string | null;
  etapeSuivante?: string | null;
  onEtapeSuivante?: () => void;
  className?: string;
  taille?: "xs" | "sm";
}

/** Appeler, écrire, ouvrir LinkedIn / le site, passer à l'étape suivante. */
export function ActionsRapides({ telephone, email, linkedin, site, etapeSuivante, onEtapeSuivante, className, taille = "xs" }: Props) {
  const size = taille === "xs" ? "icon-xs" : "icon-sm";
  const liens = [
    { href: telHref(telephone), icone: Phone, label: telephone ? `Appeler ${telephone}` : "Pas de téléphone" },
    { href: email ? `mailto:${email}` : null, icone: Mail, label: email ? `Écrire à ${email}` : "Pas d'email" },
    { href: urlExterne(linkedin), icone: Linkedin, label: linkedin ? "Ouvrir LinkedIn" : "Pas de LinkedIn", externe: true },
    { href: urlExterne(site), icone: Globe, label: site ? "Ouvrir le site" : "Pas de site", externe: true },
  ];
  return (
    <div className={cn("flex items-center gap-0.5", className)} onClick={(e) => e.stopPropagation()}>
      {liens.map(({ href, icone: Icone, label, externe }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            {href ? (
              <Button variant="ghost" size={size} asChild className="text-muted-foreground hover:text-foreground">
                <a href={href} aria-label={label} {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <Icone />
                </a>
              </Button>
            ) : (
              <span>
                <Button variant="ghost" size={size} disabled aria-label={label} className="text-muted-foreground/40">
                  <Icone />
                </Button>
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
      {etapeSuivante && onEtapeSuivante && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size={size} onClick={onEtapeSuivante} aria-label={`Passer à : ${etapeSuivante}`} className="text-muted-foreground hover:text-primary">
              <ArrowRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Passer à « {etapeSuivante} »</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
