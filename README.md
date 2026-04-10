# Club Jean Jaurès — PWA

Application PWA pour le Club de Jean Jaurès, club d'affaires de Saint-Étienne.

## Stack technique

- **Frontend** : React 18 + Vite + Tailwind CSS + PWA (vite-plugin-pwa)
- **Backend** : Node.js + Express
- **Base de données** : PostgreSQL + Prisma ORM
- **Auth** : Magic Link (email) + sessions
- **Hébergement** : Railway

## Installation

```bash
npm install
cd client && npm install
```

## Configuration

Copier `.env.example` vers `.env` et renseigner les variables :

```
DATABASE_URL=postgresql://...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EMAIL_API_KEY=...
APP_URL=http://localhost:5173
```

## Développement

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schema en base
npm run db:push

# Seeder la base (20 événements 2026 + admin)
npm run db:seed

# Lancer en développement
npm run dev
```

## Production (Railway)

Le déploiement est automatique via `railway.toml`. La commande de démarrage exécute les migrations, le seed, puis le serveur.

## Modules

- **Annuaire** : profils membres, recherche, carte Leaflet, favoris
- **Agenda** : événements, filtres, export iCal, abonnement webcal
- **Fil d'actualité** : publications, commentaires, likes, demandes
- **Administration** : dashboard, gestion membres, événements, paramètres
- **Page vitrine** : présentation publique du club
