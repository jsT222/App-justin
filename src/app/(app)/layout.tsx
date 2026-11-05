import { getSession } from "@/lib/supabase/server";
import { getEtapes, getListes } from "@/lib/data";
import { Raccourcis } from "@/components/raccourcis/raccourcis";
import { BoutonRecherche } from "@/components/raccourcis/bouton-recherche";
import { Sidebar } from "@/components/layout/sidebar";
import { EnteteMobile } from "@/components/layout/entete-mobile";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getSession();
  const [{ data: profil }, { data: hotels }, etapes, listes] = await Promise.all([
    supabase.from("profils").select("nom_complet").eq("user_id", user.id).maybeSingle(),
    supabase.from("hotels").select("id, nom, ville").order("nom"),
    getEtapes(),
    getListes(),
  ]);
  const nom = profil?.nom_complet || user.email?.split("@")[0] || "Moi";
  const email = user.email ?? "";

  return (
    <Raccourcis hotels={hotels ?? []} etapes={etapes} listes={listes}>
    <div className="min-h-dvh">
      <Sidebar nom={nom} email={email}><BoutonRecherche large /></Sidebar>
      <EnteteMobile nom={nom} email={email}><BoutonRecherche /></EnteteMobile>
      <main className="lg:pl-60">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 has-[[data-pleine-largeur]]:max-w-none px-4 py-5 pb-24 sm:px-6 lg:py-6">{children}</div>
      </main>
    </div>
    </Raccourcis>
  );
}
