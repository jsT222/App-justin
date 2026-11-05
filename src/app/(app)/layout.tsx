import { getSession } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { EnteteMobile } from "@/components/layout/entete-mobile";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getSession();
  const { data: profil } = await supabase.from("profils").select("nom_complet").eq("user_id", user.id).maybeSingle();
  const nom = profil?.nom_complet || user.email?.split("@")[0] || "Moi";
  const email = user.email ?? "";

  return (
    <div className="min-h-dvh">
      <Sidebar nom={nom} email={email} />
      <EnteteMobile nom={nom} email={email} />
      <main className="lg:pl-60">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 px-4 py-5 pb-24 sm:px-6 lg:py-6">{children}</div>
      </main>
    </div>
  );
}
