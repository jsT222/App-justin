import {
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface ElementNav {
  titre: string;
  href: string;
  icone: LucideIcon;
  /** Touche après « G » pour y aller */
  raccourci?: string;
}

export const NAVIGATION: ElementNav[] = [
  { titre: "Dashboard", href: "/dashboard", icone: LayoutDashboard, raccourci: "D" },
  { titre: "Pipeline", href: "/pipeline", icone: KanbanSquare, raccourci: "P" },
  { titre: "Prospects", href: "/prospects", icone: Building2, raccourci: "L" },
  { titre: "Agenda", href: "/agenda", icone: CalendarDays, raccourci: "A" },
  { titre: "Propositions", href: "/propositions", icone: FileText },
  { titre: "Clients", href: "/clients", icone: Handshake, raccourci: "C" },
  { titre: "Bibliothèque", href: "/bibliotheque", icone: BookOpen },
  { titre: "Objectifs", href: "/objectifs", icone: Target },
  { titre: "Paramètres", href: "/parametres", icone: Settings },
];
