# ⚡ Rapply

**Rapply** est une application web tout-en-un de gestion et d'organisation personnelle (interface en français), combinant le suivi des échéances et abonnements, la gestion financière et budgétaire, la prise de notes et un emploi du temps hebdomadaire.

---

## 🚀 Fonctionnalités

### ⏰ Rappels & Abonnements
- Suivi des échéances par type : **Abonnements**, **Achats**, **Tâches**, **Programmes en ligne**, **Autres**.
- Gestion des récurrences (quotidienne, hebdomadaire, mensuelle, trimestrielle, annuelle, personnalisée).
- Système de notifications progressives par étapes (*stages* à 50% / 80% / 100% ou 70% / 90% / 100% du délai).
- Choix du timing de notification : temps réel ou récapitulatif du matin (*digest*).

### 💰 Finances & Transactions
- Enregistrement et suivi des revenus et dépenses.
- Catégorisation personnalisable avec couleurs et icônes.
- Devise configurable (par défaut `XOF`).
- Liaison possible d'une dépense à un rappel / abonnement.

### 📊 Budgets & Alertes
- Définition de budgets par catégorie (mensuels ou sur périodes personnalisées).
- Suivi visuel des consommations budgétaires.
- Alertes de seuils (80%, 95%, 100%) envoyées par notification push.

### 📝 Prise de notes
- Prise de notes rapides et organisées.
- Possibilité d'associer une note à un rappel existant.

### 📅 Emploi du temps
- Organisation des créneaux récurrents par jour de la semaine.
- Support des événements ponctuels sur date spécifique.

### 🔔 Notifications Push Web
- Notifications push natives via Web Push API et Service Worker (`public/sw.js`).
- Déclenchement automatique par tâches cron sécurisées via `CRON_SECRET`.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router) avec React 19
- **Langage** : TypeScript
- **Styles** : Tailwind CSS v4
- **Base de données & ORM** : PostgreSQL & [Prisma 7.10](https://www.prisma.io/) (via le driver adapter `@prisma/adapter-pg`)
- **Authentification** : JWT dans un cookie `httpOnly` validé par le proxy racine (`proxy.ts`)
- **Notifications** : `web-push`
- **Gestionnaire de paquets** : `pnpm`

---

## ⚙️ Variables d'environnement

Créez un fichier `.env` à la racine du projet inspiré de l'exemple ci-dessous :

```env
# Base de données (PostgreSQL / Neon)
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# URL de l'application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentification JWT
JWT_SECRET="votre_cle_secrete_jwt"

# Notifications Push (VAPID)
VAPID_PUBLIC_KEY="votre_cle_publique_vapid"
VAPID_PRIVATE_KEY="votre_cle_privee_vapid"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="votre_cle_publique_vapid"

# Cron (protection des endpoints /api/push/*)
CRON_SECRET="votre_cle_secrete_cron"
```

---

## 📦 Installation & Démarrage

1. **Cloner le projet et installer les dépendances** :
   ```bash
   git clone <url-du-repo>
   cd rapply
   pnpm install
   ```

2. **Générer le client Prisma** :
   ```bash
   npx prisma generate
   ```

3. **Appliquer les migrations / synchroniser la base de données** :
   ```bash
   npx prisma db push
   # ou
   npx prisma migrate dev
   ```

4. **(Optionnel) Initialiser avec les données de test** :
   ```bash
   npx prisma db seed
   ```

5. **Lancer le serveur de développement** :
   ```bash
   pnpm dev
   ```
   L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts disponibles

| Commande | Description |
| :--- | :--- |
| `pnpm dev` | Démarre le serveur de développement |
| `pnpm build` | Compile l'application pour la production (avec type checking) |
| `pnpm start` | Démarre le serveur de production |
| `pnpm lint` | Lance l'analyse statique du code avec ESLint |
| `npx prisma generate` | Régénère le client Prisma dans `app/generated/prisma` |
| `npx prisma db seed` | Exécute le seed de la base de données (`prisma/seed.ts`) |

---

## 🏗️ Architecture du projet

```
rapply/
├── app/
│   ├── (dashboard)/        # Routes principales authentifiées
│   │   ├── budgets/        # Gestion des budgets
│   │   ├── finances/       # Suivi des finances et transactions
│   │   ├── notes/          # Prise de notes
│   │   ├── reminders/      # Gestion des rappels et abonnements
│   │   ├── schedule/       # Emploi du temps
│   │   └── page.tsx        # Tableau de bord principal
│   ├── api/                # Route Handlers (REST API)
│   │   ├── auth/           # Login / Logout
│   │   ├── budgets/        # Endpoints budgets
│   │   ├── categories/     # Endpoints catégories
│   │   ├── notes/          # Endpoints notes
│   │   ├── push/           # Souscription et déclenchements cron push
│   │   ├── reminders/      # Endpoints rappels
│   │   ├── schedule/       # Endpoints planning
│   │   ├── stats/          # Statistiques
│   │   ├── transactions/   # Endpoints transactions
│   │   └── user/           # Profil & préférences utilisateur
│   ├── components/         # Composants React partagés
│   ├── generated/prisma/   # Client Prisma généré (gitignored)
│   ├── lib/                # Utilitaires, client Prisma, gestion d'auth
│   └── login/              # Page de connexion
├── prisma/
│   ├── schema.prisma       # Schéma de la base de données
│   └── seed.ts             # Script de seed
├── public/                 # Assets statiques et Service Worker (sw.js)
├── prisma7.config.ts       # Configuration Prisma 7
└── proxy.ts                # Middleware / Proxy d'authentification Next.js 16
```
