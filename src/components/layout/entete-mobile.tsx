"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Marque, NavLiens, PiedSidebar } from "./sidebar";

export function EnteteMobile({ nom, email, children }: { nom: string; email: string; children?: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur lg:hidden">
      <Button variant="ghost" size="icon-sm" aria-label="Ouvrir le menu" onClick={() => setOuvert(true)}>
        <Menu />
      </Button>
      <Marque />
      <div className="ml-auto flex items-center gap-1">{children}</div>
      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetContent side="left" className="w-64 gap-4 bg-sidebar px-2 py-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Marque />
          <div className="flex-1 overflow-y-auto">
            <NavLiens onNavigate={() => setOuvert(false)} />
          </div>
          <PiedSidebar nom={nom} email={email} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
