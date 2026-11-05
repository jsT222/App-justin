import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { totauxProposition } from "@/lib/calculs/proposition";
import type { LigneProposition, Profil, Proposition } from "@/lib/types";

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n).replace(/ | /g, " ");
const date = (d: string | null) => (d ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(d)) : "—");

const ACCENT = "#4f46e5";
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, fontFamily: "Helvetica", color: "#18181b", lineHeight: 1.45 },
  entete: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  logo: { width: 110, height: 44, objectFit: "contain", marginBottom: 6 },
  marque: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ACCENT, marginBottom: 4 },
  petit: { fontSize: 8.5, color: "#52525b" },
  titreDoc: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right", lineHeight: 1.1, marginBottom: 6 },
  bloc: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  carte: { backgroundColor: "#f4f4f5", padding: 10, borderRadius: 4, width: "48%" },
  label: { fontSize: 7.5, color: "#71717a", textTransform: "uppercase", marginBottom: 3, letterSpacing: 0.5 },
  gras: { fontFamily: "Helvetica-Bold" },
  intro: { marginBottom: 16 },
  tete: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#18181b", paddingBottom: 5, marginBottom: 2, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  ligne: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#e4e4e7", paddingVertical: 7 },
  cDesc: { flex: 1, paddingRight: 8 },
  cQte: { width: 34, textAlign: "center" },
  cPrix: { width: 82, textAlign: "right" },
  totaux: { marginTop: 14, marginLeft: "auto", width: 250 },
  tLigne: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  tFort: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTopWidth: 1, borderColor: "#18181b", fontFamily: "Helvetica-Bold", fontSize: 11 },
  conditions: { marginTop: 24, padding: 10, borderWidth: 0.5, borderColor: "#d4d4d8", borderRadius: 4 },
  signature: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  case: { width: "46%", height: 70, borderWidth: 0.5, borderColor: "#d4d4d8", borderRadius: 4, padding: 8 },
  pied: { position: "absolute", bottom: 24, left: 40, right: 40, textAlign: "center", fontSize: 7.5, color: "#a1a1aa" },
});

export function PropositionPdf({
  proposition: p,
  lignes,
  profil,
  hotel,
  contact,
}: {
  proposition: Proposition;
  lignes: LigneProposition[];
  profil: Profil | null;
  hotel: { nom: string; adresse: string | null; code_postal: string | null; ville: string | null };
  contact: { prenom: string | null; nom: string | null; email: string | null } | null;
}) {
  const t = totauxProposition(lignes, p.remise_pct);
  const nomPresta = profil?.raison_sociale || profil?.nom_complet || "Consultant";
  return (
    <Document title={`${p.numero} — ${hotel.nom}`} author={nomPresta} language="fr">
      <Page size="A4" style={s.page}>
        <View style={s.entete}>
          <View style={{ maxWidth: 260 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {profil?.logo_url ? <Image src={profil.logo_url} style={s.logo} /> : <Text style={s.marque}>{nomPresta}</Text>}
            {profil?.logo_url && <Text style={s.gras}>{nomPresta}</Text>}
            {profil?.adresse && <Text style={s.petit}>{profil.adresse}</Text>}
            <Text style={s.petit}>{[profil?.email, profil?.telephone].filter(Boolean).join(" · ")}</Text>
            {profil?.site_web && <Text style={s.petit}>{profil.site_web}</Text>}
            {profil?.siret && <Text style={s.petit}>SIRET {profil.siret}</Text>}
          </View>
          <View>
            <Text style={s.titreDoc}>Proposition</Text>
            <Text style={[s.petit, { textAlign: "right" }]}>N° {p.numero}</Text>
            <Text style={[s.petit, { textAlign: "right" }]}>Date : {date(p.date_envoi ?? p.created_at)}</Text>
            <Text style={[s.petit, { textAlign: "right" }]}>Valable jusqu&apos;au : {date(p.date_validite)}</Text>
          </View>
        </View>

        <View style={s.bloc}>
          <View style={s.carte}>
            <Text style={s.label}>Client</Text>
            <Text style={s.gras}>{hotel.nom}</Text>
            {contact && (contact.prenom || contact.nom) && <Text>À l&apos;attention de {[contact.prenom, contact.nom].filter(Boolean).join(" ")}</Text>}
            {hotel.adresse && <Text>{hotel.adresse}</Text>}
            <Text>{[hotel.code_postal, hotel.ville].filter(Boolean).join(" ")}</Text>
          </View>
          <View style={s.carte}>
            <Text style={s.label}>Objet</Text>
            <Text style={s.gras}>{p.titre}</Text>
          </View>
        </View>

        {p.introduction && <Text style={s.intro}>{p.introduction}</Text>}

        <View style={s.tete}>
          <Text style={s.cDesc}>Prestation</Text>
          <Text style={s.cQte}>Qté</Text>
          <Text style={s.cPrix}>Mise en place</Text>
          <Text style={s.cPrix}>Maintenance / mois</Text>
        </View>
        {lignes.map((l) => (
          <View key={l.id} style={s.ligne} wrap={false}>
            <View style={s.cDesc}>
              <Text style={s.gras}>{l.libelle}</Text>
              {l.description && <Text style={s.petit}>{l.description}</Text>}
            </View>
            <Text style={s.cQte}>{l.quantite}</Text>
            <Text style={s.cPrix}>{eur(l.quantite * l.prix_setup)}</Text>
            <Text style={s.cPrix}>{eur(l.quantite * l.prix_mensuel)}</Text>
          </View>
        ))}

        <View style={s.totaux} wrap={false}>
          <View style={s.tLigne}><Text>Mise en place</Text><Text>{eur(t.setupBrut)}</Text></View>
          {t.remise > 0 && <View style={s.tLigne}><Text>Remise ({p.remise_pct} %)</Text><Text>− {eur(t.remise)}</Text></View>}
          <View style={s.tFort}><Text>Total mise en place HT</Text><Text>{eur(t.setup)}</Text></View>
          <View style={[s.tFort, { borderTopWidth: 0, marginTop: 0, color: ACCENT }]}><Text>Maintenance HT</Text><Text>{eur(t.mensuel)} / mois</Text></View>
          {profil?.mention_tva && <Text style={[s.petit, { textAlign: "right" }]}>{profil.mention_tva}</Text>}
        </View>

        {(p.conditions || profil?.iban) && (
          <View style={s.conditions} wrap={false}>
            <Text style={s.label}>Conditions</Text>
            {p.conditions && <Text>{p.conditions}</Text>}
            {profil?.iban && <Text style={s.petit}>IBAN : {profil.iban}</Text>}
          </View>
        )}

        <View style={s.signature} wrap={false}>
          <View style={s.case}><Text style={s.label}>Le prestataire</Text><Text style={s.petit}>{nomPresta}</Text></View>
          <View style={s.case}><Text style={s.label}>Bon pour accord — date et signature</Text><Text style={s.petit}>{hotel.nom}</Text></View>
        </View>

        <Text style={s.pied} render={({ pageNumber, totalPages }) => `${nomPresta}${profil?.siret ? ` · SIRET ${profil.siret}` : ""} · ${p.numero} · page ${pageNumber}/${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
