# 🛡️ Cayo — Family-First Password Manager

**Lien Live :** [https://cayo-zeta.vercel.app/](https://cayo-zeta.vercel.app/)

Cayo est un gestionnaire de mots de passe **Zero-Knowledge** conçu pour les familles et les groupes. Il permet de sécuriser ses propres identifiants mais aussi de créer et gérer des comptes pour ses proches (parents, enfants) au sein d'un environnement chiffré de bout en bout.

## 🔒 Architecture de Sécurité & Cryptographie

La sécurité de Cayo repose sur un système de chiffrement hybride effectué exclusivement côté client.

### 1. Inscription et Coffre-fort Personnel

L'application génère une suite de clés sécurisées localement :

- **Dérivation PBKDF2 :** Le Mot de Passe Maître n'est jamais stocké. Il est utilisé pour dériver une clé de chiffrement via PBKDF2 (HMAC-SHA256, 100 000 itérations) avec un sel unique.
- **Paire de clés RSA :** Une paire de clés (Public/Private) est générée pour les échanges asymétriques.
- **Chiffrement AES-256-CBC :** Les données sensibles sont chiffrées symétriquement avant envoi. La clé privée RSA est elle-même protégée par la clé AES dérivée du mot de passe.

### 2. Gestion de Groupes & Partage Sécurisé

- **Clé de Groupe :** Chaque organisation possède sa propre clé AES.
- **Partage Asymétrique :** Pour inviter un membre, sa clé publique RSA est utilisée pour chiffrer la clé AES du groupe. Supabase ne stocke que des fragments chiffrés.
- **Auto-Lock :** Un système de monitoring d'inactivité (`Zustand` stateful timer) verrouille automatiquement le coffre-fort et purge les clés de la mémoire après 15 minutes d'inactivité.

## 🚀 Expertise Technique Frontend

Développé avec une exigence de performance et de fluidité, le frontend exploite les standards de 2026 :

- **Framework :** Next.js 15 (App Router) avec Server & Client Components.
- **State Management & Logic :** - **Zustand :** Multi-stores pour la gestion de l'auth, des organisations et des mots de passe.
  - **Optimisation Network :** Système de cache intelligent et dédoublonnage de requêtes (Request Deduplication) lors du déchiffrement massif des données.
- **Animations :** `framer-motion` pour une expérience fluide (Staggered lists, smooth transitions).
- **UI :** Tailwind CSS + Radix UI pour une accessibilité totale.

## 🎨 Spécificité UX/UI

- **Onboarding Parent :** Création de compte simplifiée pour les tiers moins à l'aise avec la technique.
- **Feedback visuel :** États de chargement granulaires ("Unlocking vault...", "Generating keys...") pour informer l'utilisateur sur les processus de sécurité en cours.

## 🛠️ Installation locale

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm run dev
```
