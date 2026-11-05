# Hôtels CRM

Dashboard de prospection et de suivi clients pour un consultant freelance en automatisation IA spécialisé dans l'hôtellerie.

**Stack :** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth, RLS) · Vercel

## Démarrage local

```bash
npm install
cp .env.example .env.local   # renseigner l'URL et la clé publishable Supabase
npm run dev
```

## Base de données

Les migrations SQL sont dans `supabase/migrations/` (schéma, logique métier, données par défaut, données de démo).
Chaque utilisateur ne voit que ses données (Row Level Security sur toutes les tables).

À l'inscription, un trigger crée : profil, 8 étapes de pipeline, sources/douleurs/services/PMS, 7 offres, 6 modèles de messages et les objectifs par défaut.
Les données de démo (20 hôtels, 3 clients) se chargent depuis **Paramètres → Charger les données de démo**.

## Modules

Dashboard · Pipeline (Kanban) · Prospects (import/export CSV, doublons) · Fiche hôtel · Agenda et relances (séquences J+3/7/14 automatiques) · Propositions (PDF) · Clients (MRR, upsell à 3 mois) · Bibliothèque · Objectifs · Paramètres.

Raccourcis : `Ctrl/⌘ K`, `N`, `R`, `/`, `G` puis `D/P/L/A/C`, `E` sur une fiche, `Ctrl/⌘ Entrée` pour noter, `?` pour l'aide.

## Déploiement

Voir [DEPLOIEMENT.md](DEPLOIEMENT.md).

## Tests

```bash
npm run typecheck
npm test                                        # tests unitaires (Vitest)
E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e  # tests de bout en bout (Playwright, serveur lancé sur :3000)
```

Les tests E2E rechargent les données de démo du compte de test : n'utilise **jamais** ton compte réel pour `E2E_EMAIL`.

```bash
```
