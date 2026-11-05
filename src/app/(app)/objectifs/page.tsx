import type { Metadata } from "next";
import { addWeeks, endOfMonth, format, startOfMonth, startOfWeek, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ActiviteJour } from "@/components/dashboard/activite-jour";
import { PageEntete } from "@/components/layout/page-entete";
import { HistoriqueSemaines } from "@/components/objectifs/historique";
import { ObjectifsMois } from "@/components/objectifs/objectifs-mois";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activiteDuJour, objectifPour } from "@/lib/calculs/dashboard";
import { normaliserNombres } from "@/lib/data";
import { aujourdhuiParis, PARIS } from "@/lib/dates";
import { getSession } from "@/lib/supabase/server";
import type { ActiviteQuotidienne, ClientVue, Objectif } from "@/lib/types";

export const metadata: Metadata = { title: "Objectifs" };

export default async function PageObjectifs() {
  const { supabase } = await getSession();
  const maintenant = new Date();
  const debutMois = startOfMonth(maintenant, PARIS);
  const finMois = endOfMonth(maintenant, PARIS);
  const debutHisto = subWeeks(startOfWeek(maintenant, { weekStartsOn: 1, ...PARIS }), 7);
  const [obj, act, rdv, clients] = await Promise.all([
    supabase.from("objectifs").select("*"),
    supabase.from("activite_quotidienne").select("*").gte("date", format(debutHisto, "yyyy-MM-dd", PARIS)).order("date"),
    supabase.from("relances").select("id", { count: "exact", head: true }).eq("type", "rdv").neq("statut", "annule").gte("date_prevue", debutMois.toISOString()).lte("date_prevue", finMois.toISOString()),
    supabase.from("v_clients").select("*").gte("date_signature", format(debutMois, "yyyy-MM-dd", PARIS)),
  ]);
  const objectifs = normaliserNombres(obj.data ?? []) as Objectif[];
  const activites = (act.data ?? []) as ActiviteQuotidienne[];
  const signes = normaliserNombres(clients.data ?? []) as ClientVue[];
  const jour = activiteDuJour(activites, aujourdhuiParis());
  const quotidien = { linkedin: objectifPour(objectifs, "linkedin"), appels: objectifPour(objectifs, "appels"), emails: objectifPour(objectifs, "emails") };

  const semaines = Array.from({ length: 8 }, (_, i) => {
    const debut = addWeeks(debutHisto, i);
    const fin = addWeeks(debut, 1);
    const jours = activites.filter((a) => a.date >= format(debut, "yyyy-MM-dd", PARIS) && a.date < format(fin, "yyyy-MM-dd", PARIS));
    return {
      semaine: format(debut, "d MMM", { locale: fr, ...PARIS }),
      linkedin: jours.reduce((s, a) => s + a.linkedin, 0),
      appels: jours.reduce((s, a) => s + a.appels, 0),
      emails: jours.reduce((s, a) => s + a.emails, 0),
    };
  });

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageEntete titre="Objectifs" description="La régularité fait le pipeline." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aujourd&apos;hui</CardTitle>
            <CardDescription>Objectifs quotidiens (modifiables dans Paramètres)</CardDescription>
          </CardHeader>
          <CardContent><ActiviteJour valeurs={{ linkedin: jour.linkedin, appels: jour.appels, emails: jour.emails }} objectifs={quotidien} /></CardContent>
        </Card>
        <ObjectifsMois
          mois={format(debutMois, "yyyy-MM-dd", PARIS)}
          libelleMois={format(maintenant, "MMMM yyyy", { locale: fr, ...PARIS })}
          realise={{ rdv: rdv.count ?? 0, signatures: signes.length, ca: signes.reduce((s, c) => s + c.total_setup, 0) }}
          cibles={{ rdv: objectifPour(objectifs, "rdv"), signatures: objectifPour(objectifs, "signatures"), ca: objectifPour(objectifs, "ca") }}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historique par semaine</CardTitle>
          <CardDescription>Objectif hebdomadaire = objectif quotidien × 5 jours</CardDescription>
        </CardHeader>
        <CardContent><HistoriqueSemaines semaines={semaines} cibles={{ linkedin: quotidien.linkedin * 5, appels: quotidien.appels * 5, emails: quotidien.emails * 5 }} /></CardContent>
      </Card>
    </div>
  );
}
