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

## Tests

```bash
npm run typecheck
npm test                                        # tests unitaires (Vitest)
E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e  # tests de bout en bout (Playwright, serveur lancé sur :3000)
```
