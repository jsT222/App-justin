# Déploiement : Vercel + Supabase

Le projet Supabase **app-justin** (région Paris, `qnqjosorqhrgoplvrqdh`) existe déjà et contient toutes les migrations de `supabase/migrations/`.

## 1. Créer le projet sur Vercel

1. Va sur <https://vercel.com/new> et connecte-toi avec GitHub.
2. Importe le dépôt **jsT222/App-justin**. Vercel détecte Next.js tout seul (laisse les réglages de build par défaut).
3. Avant de cliquer sur **Deploy**, ouvre **Environment Variables** et ajoute :

   | Nom | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://qnqjosorqhrgoplvrqdh.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la clé *publishable* (Supabase → Project Settings → API Keys, commence par `sb_publishable_`) |

4. Clique sur **Deploy**. Note l'URL obtenue (ex. `https://app-justin.vercel.app`).

## 2. Configurer l'authentification Supabase

Dans Supabase → **Authentication → URL Configuration** :

- **Site URL** : l'URL Vercel (ex. `https://app-justin.vercel.app`)
- **Redirect URLs** : ajoute `https://app-justin.vercel.app/auth/callback` (et `http://localhost:3000/auth/callback` pour le local)

## 3. Créer ton compte puis fermer les inscriptions

1. Ouvre l'app → **Créer le compte** (nom, email, mot de passe d'au moins 8 caractères).
2. Clique sur le lien de confirmation reçu par email.
3. Connecte-toi : tes étapes, offres, modèles et objectifs sont déjà créés.
4. **Paramètres → Données → Charger les données de démo** si tu veux explorer avec les 20 hôtels fictifs (tu pourras repartir de zéro en supprimant les hôtels).
5. Dans Supabase → **Authentication → Sign In / Providers → Email**, désactive **Allow new users to sign up** : personne d'autre ne pourra créer de compte.

## 4. Mises à jour

Chaque `git push` sur `main` redéploie automatiquement sur Vercel.
Pour une nouvelle migration SQL : ajoute un fichier dans `supabase/migrations/` puis applique-le (SQL Editor de Supabase, ou `supabase db push` avec la CLI).

## Domaine personnalisé (optionnel)

Vercel → projet → **Settings → Domains** → ajoute ton domaine, puis mets à jour la *Site URL* et les *Redirect URLs* Supabase.
