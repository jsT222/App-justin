import type { Metadata } from "next";
import Link from "next/link";
import { endOfDay, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Handshake, Percent, Repeat, Target, TrendingUp, Users } from "lucide-react";
import { ActiviteJour } from "@/components/dashboard/activite-jour";
import { GraphiqueMensuel } from "@/components/dashboard/graphique-mensuel";
import { LigneRelance } from "@/components/hotel/prochaines-actions";
import { Etoiles } from "@/components/hotel/etoiles";
import { PageEntete } from "@/components/layout/page-entete";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { activiteDuJour, calculerKpis, objectifPour, serieMensuelle } from "@/lib/calculs/dashboard";
import { MOIS } from "@/lib/constantes";
import { getHotelsVue, normaliserNombres } from "@/lib/data";
import { aujourdhuiParis, dateCourte, estEnRetard, PARIS } from "@/lib/dates";
import { aContacterMaintenant } from "@/lib/pipeline";
import { getSession } from "@/lib/supabase/server";
import type { ActiviteQuotidienne, ClientVue, Objectif, RelanceAvecHotel } from "@/lib/types";
import { cn, euros, pourcentage } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function Kpi({ titre, valeur, detail, icone: Icone, href }: { titre: string; valeur: string; detail?: React.ReactNode; icone: React.ComponentType<{ className?: string }>; href?: string }) {
  const contenu = (
    <Card className="h-full gap-1 py-4 transition-colors hover:bg-accent/40">
      <CardHeader className="px-4">
        <CardDescription className="flex items-center gap-1.5 text-xs"><Icone className="size-3.5" /> {titre}</CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{valeur}</p>
        {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} aria-label={titre}>{contenu}</Link> : contenu;
}

export default async function PageDashboard() {
  const { supabase, user } = await getSession();
  const maintenant = new Date();
  const debutHisto = subMonths(startOfMonth(maintenant, PARIS), 5).toISOString();
  const [hotels, relancesKpi, relancesJour, clientsR, objectifsR, activitesR, profil] = await Promise.all([
    getHotelsVue(),
    supabase.from("relances").select("type, statut, date_prevue").gte("date_prevue", debutHisto),
    supabase
      .from("relances")
      .select("*, hotels(id, nom, ville)")
      .eq("statut", "a_faire")
      .lte("date_prevue", endOfDay(maintenant, PARIS).toISOString())
      .order("date_prevue"),
    supabase.from("v_clients").select("*"),
    supabase.from("objectifs").select("*"),
    supabase.from("activite_quotidienne").select("*").eq("date", aujourdhuiParis()),
    supabase.from("profils").select("nom_complet").eq("user_id", user.id).maybeSingle(),
  ]);

  const clients = normaliserNombres(clientsR.data ?? []) as ClientVue[];
  const objectifs = normaliserNombres(objectifsR.data ?? []) as Objectif[];
  const relances = relancesKpi.data ?? [];
  const k = calculerKpis(hotels, relances, clients, maintenant);
  const serie = serieMensuelle(hotels, relances, clients, 6, maintenant);
  const aFaire = (relancesJour.data ?? []) as RelanceAvecHotel[];
  const nbRetard = aFaire.filter((r) => estEnRetard(r.date_prevue)).length;
  const act = activiteDuJour((activitesR.data ?? []) as ActiviteQuotidienne[], aujourdhuiParis());
  const objCa = objectifPour(objectifs, "ca", maintenant);
  const pctCa = objCa ? (k.caSigneMois / objCa) * 100 : 0;
  const upsells = clients.filter((c) => c.statut === "actif" && c.prochain_upsell && c.prochain_upsell <= aujourdhuiParis());
  const moisCourant = maintenant.getMonth() + 1;
  const saison = hotels
    .filter((h) => h.etape_code !== "gagne" && h.etape_code !== "perdu" && aContacterMaintenant(h.mois_creux, maintenant))
    .concat(hotels.filter((h) => h.etape_code === "perdu" && h.date_recontact && new Date(h.date_recontact) <= new Date(Date.now() + 30 * 864e5)))
    .slice(0, 8);
  const prenom = (profil.data?.nom_complet ?? "").split(" ")[0];

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageEntete
        titre={`Bonjour${prenom ? ` ${prenom}` : ""} 👋`}
        description={format(maintenant, "EEEE d MMMM yyyy", { locale: fr, ...PARIS }).replace(/^./, (c) => c.toUpperCase())}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi titre="Prospects actifs" valeur={String(k.prospectsActifs)} icone={Users} href="/prospects" detail={`${hotels.length} hôtels au total`} />
        <Kpi titre="RDV cette semaine" valeur={String(k.rdvSemaine)} icone={CalendarDays} href="/agenda" />
        <Kpi titre="Taux de conversion" valeur={pourcentage(k.tauxConversion)} icone={Percent} detail={`${k.gagnes} gagnés · ${k.perdus} perdus`} />
        <Kpi titre="CA signé (mois)" valeur={euros(k.caSigneMois)} icone={Handshake} detail={`${euros(k.caSigneTotal)} au total`} href="/clients" />
        <Kpi titre="CA potentiel pondéré" valeur={euros(k.pipelinePondere)} icone={TrendingUp} detail={`${euros(k.pipelineBrut)} brut (1re année)`} href="/pipeline" />
        <Kpi titre="MRR" valeur={euros(k.mrr)} icone={Repeat} detail={`${euros(k.mrr * 12)} / an`} href="/clients" />
      </div>

      <Card className="gap-3 py-4">
        <CardContent className="grid gap-2 px-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 font-medium"><Target className="size-4 text-primary" /> Objectif CA de {format(maintenant, "MMMM", { locale: fr, ...PARIS })}</span>
            <span className="tabular-nums"><span className="font-semibold">{euros(k.caSigneMois)}</span> <span className="text-muted-foreground">/ {euros(objCa)} · {pourcentage(Math.min(pctCa, 999))}</span></span>
          </div>
          <Progress value={pctCa} className="h-2.5" indicatorClassName={pctCa >= 100 ? "bg-success" : undefined} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className={cn(nbRetard > 0 && "border-destructive/40")}>
          <CardHeader>
            <CardTitle>Relances du jour</CardTitle>
            <CardDescription>
              {aFaire.length === 0 ? "Rien à faire aujourd'hui." : <>{aFaire.length} à faire{nbRetard > 0 && <span className="font-medium text-destructive"> · {nbRetard} en retard</span>}</>}
            </CardDescription>
            <CardAction><Link href="/agenda" className="text-xs text-muted-foreground hover:text-foreground">Agenda →</Link></CardAction>
          </CardHeader>
          <CardContent className="grid gap-0.5">
            {aFaire.slice(0, 10).map((r) => <LigneRelance key={r.id} r={r} avecHotel />)}
            {upsells.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-accent">
                <Badge variant="success">Upsell</Badge>
                <span className="truncate"><span className="font-medium">{c.hotel_nom}</span> · proposer une nouvelle automatisation</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité de prospection</CardTitle>
            <CardDescription>Aujourd&apos;hui, par rapport à tes objectifs quotidiens</CardDescription>
          </CardHeader>
          <CardContent>
            <ActiviteJour
              valeurs={{ linkedin: act.linkedin, appels: act.appels, emails: act.emails }}
              objectifs={{ linkedin: objectifPour(objectifs, "linkedin"), appels: objectifPour(objectifs, "appels"), emails: objectifPour(objectifs, "emails") }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Les 6 derniers mois</CardTitle>
          </CardHeader>
          <CardContent>
            <GraphiqueMensuel donnees={serie} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saisonnalité</CardTitle>
            <CardDescription>Période creuse en {MOIS[moisCourant - 1].toLowerCase()} ou {MOIS[moisCourant % 12].toLowerCase()} : le bon moment pour les contacter</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1">
            {saison.length === 0 && <p className="text-sm text-muted-foreground">Aucun hôtel en période creuse ce mois-ci.</p>}
            {saison.map((h) => (
              <Link key={h.id} href={`/prospects/${h.id}`} className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-accent">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium">{h.nom}</span>
                  <Etoiles n={h.etoiles} />
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {h.etape_code === "perdu" ? <>Recontact {dateCourte(h.date_recontact)}</> : <>{h.ville} · {h.etape_nom}</>}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
