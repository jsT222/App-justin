"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAVIGATION } from "@/lib/navigation";
import { deconnexion } from "@/lib/actions/auth";
import { cn, initiales } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export function NavLiens({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-0.5">
      {NAVIGATION.map((el) => {
        const actif = pathname === el.href || pathname.startsWith(`${el.href}/`);
        return (
          <Link
            key={el.href}
            href={el.href}
            onClick={onNavigate}
            className={cn(
              "group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              actif && "bg-sidebar-accent font-medium text-sidebar-foreground",
            )}
          >
            <el.icone className={cn("size-4 shrink-0 text-muted-foreground", actif && "text-primary")} />
            <span className="flex-1 truncate">{el.titre}</span>
            {el.raccourci && (
              <kbd className="hidden text-[10px] text-muted-foreground/70 group-hover:inline">G {el.raccourci}</kbd>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function Marque() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">H</div>
      <span className="text-sm font-semibold tracking-tight">Hôtels CRM</span>
    </div>
  );
}

export function PiedSidebar({ nom, email }: { nom: string; email: string }) {
  return (
    <div className="flex items-center gap-2 border-t border-sidebar-border px-2 pt-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {initiales(nom)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{nom}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <ThemeToggle />
      <form action={deconnexion}>
        <button
          type="submit"
          aria-label="Se déconnecter"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

export function Sidebar({ nom, email, children }: { nom: string; email: string; children?: React.ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-4 border-r border-sidebar-border bg-sidebar px-2 py-3 lg:flex">
      <Marque />
      {children}
      <div className="flex-1 overflow-y-auto">
        <NavLiens />
      </div>
      <PiedSidebar nom={nom} email={email} />
    </aside>
  );
}
