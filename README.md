# Pokémon Cloud

Pokémon Cloud aide à suivre un Pokédex. Chaque utilisateur crée des checklists
par jeu, coche les Pokémon capturés et peut demander à un assistant d'appliquer
des filtres au tableau.

## Présentation

L'application s'adresse aux joueurs qui suivent plusieurs jeux sans tenir de
tableur. Une checklist est rattachée à un jeu (Pokémon Rouge, Saphir, Diamant,
Noir 2, etc.) et affiche le Pokédex régional ou national de ce jeu.

Fonctionnalités :

- inscription et connexion par e-mail et mot de passe ;
- création de checklists par jeu ;
- recherche, filtre par état (capturé, non capturé, absent de la checklist) et
  bascule entre Pokédex régional et national ;
- fiche Pokémon avec types, évolutions et rencontres ;
- assistant qui traduit une demande en langage naturel en filtres du tableau ;
- panneau `/admin`, réservé aux administrateurs, qui affiche l'état des services.

Une démonstration vidéo du parcours est disponible dans
[`docs/video.mp4`](docs/video.mp4).

## Adresse de production

https://b3-efrei-cloud-computing-pkmn-cloud.vercel.app/

## Architecture

Le navigateur n'appelle Supabase directement que pour la connexion, l'inscription et
la déconnexion. Les checklists, les Pokédex et l'assistant passent par les routes
`/api/...` de Next.js. Ces routes vérifient la session, consultent Supabase ou
PokéAPI, puis répondent. Les clés restent ainsi côté serveur, et le quota et le
cache s'appliquent avant chaque appel externe.

Une demande à l'assistant suit le même chemin. `/api/chat` vérifie la session,
décompte le quota de l'utilisateur, puis lance l'agent LangChain. L'agent peut
appeler l'outil `apply_filters`. La route renvoie une réponse texte et un patch
de filtres, et c'est le tableau qui applique ce patch.

| Service | Rôle |
| --- | --- |
| Next.js 16 (App Router) sur Vercel | Pages, routes API et proxy qui rafraîchit la session |
| Supabase Auth | Inscription, connexion et cookies de session |
| Supabase Postgres | Checklists et Pokémon capturés, protégés par RLS |
| Upstash Redis | Cache des Pokédex et des checklists, compteur du quota de l'assistant |
| OpenCode (API compatible OpenAI) | Modèle de langage de l'assistant |
| LangChain | Agent et outil `apply_filters` |
| Langfuse | Traces des appels à l'IA |
| UptimeRobot | Surveillance de `/api/health` et page de statut |
| PokéAPI | Données Pokémon ; les noms français viennent du CSV du dépôt PokeAPI |

Le cache Redis garde les Pokédex et les fiches Pokémon sept jours, les
checklists soixante secondes, et les noms français sans expiration.

### Briques au choix

**Langfuse** trace chaque appel à l'assistant : génération, tokens et coût
estimé. L'assistant est la fonction la plus coûteuse de l'application, donc
c'est là qu'une dérive de consommation doit se voir. Le prix du modèle se
synchronise avec `pnpm langfuse:sync-model`. La configuration détaillée est
dans `docs/langfuse.md`.

**UptimeRobot** surveille la route publique `/api/health`, qui ne touche ni à la
base ni à aucun secret. Une page de statut publique affiche cet état hors de
l'application : https://stats.uptimerobot.com/48vgyRuscX. Le panneau `/admin`
interroge l'API v2 en lecture seule et signale tout monitor en panne. Une
indisponibilité de Vercel ou de Supabase se voit ainsi sans attendre qu'un
utilisateur la signale.

## Modèle d'IA

Le fournisseur est OpenCode, via son inférence compatible OpenAI. Le modèle par
défaut est `deepseek-v4.1-flash` (gratuit). L'endpoint, le modèle et la clé se règlent
avec les variables listées plus bas.

L'appel se fait côté serveur, dans `src/lib/ia.ts`, avec LangChain. Le modèle
ne fait qu'une chose : traduire une demande en filtres. Son seul outil est
`apply_filters`, et il n'a pas accès aux données Pokémon. Un modèle léger suffit
donc à cette tâche, ce que confirme le fonctionnement en production. Le prompt
lui demande de ne pas inventer de données.

## Structure de données

Le schéma compte deux tables. Elles sont versionnées dans
`supabase/migrations/`.

### Tables

`checklists` regroupe les checklists d'un utilisateur.

| Champ | Rôle |
| --- | --- |
| `id` | Identifiant UUID de la checklist |
| `user_id` | Propriétaire, référence `auth.users` |
| `name` | Nom saisi par l'utilisateur |
| `game_key` | Identifiant PokéAPI du jeu, par exemple `red` |
| `revision` | Compteur de version, initialisé à 1 et non incrémenté pour l'instant |
| `created_at`, `updated_at` | Dates de création et de dernière modification |

`checklist_pokemon` contient les Pokémon d'une checklist. Il n'y a qu'une ligne
par Pokémon et par checklist. Un Pokémon sans ligne est « absent de la
checklist » : c'est le sens du filtre « Absents ».

| Champ | Rôle |
| --- | --- |
| `checklist_id` | Checklist concernée |
| `user_id` | Propriétaire, identique à celui de la checklist |
| `pokemon_api_id` | Numéro national du Pokémon |
| `is_captured` | `true` si capturé, `false` si présent mais non capturé |
| `updated_at` | Dernière modification de la ligne |

### Relations

Un utilisateur possède plusieurs checklists, et une checklist contient plusieurs
lignes de `checklist_pokemon`. La clé primaire de cette dernière table est
`(checklist_id, pokemon_api_id)`, ce qui interdit les doublons.

La clé étrangère composite `(checklist_id, user_id)` vers `checklists(id,
user_id)` impose que la ligne ait le même propriétaire que sa checklist. Une
insertion sur la checklist d'un autre utilisateur est donc refusée, même si
l'application était contournée.

### Règles de sécurité

- La RLS est activée sur les deux tables. Les policies `select`, `insert`,
  `update` et `delete` n'autorisent que les lignes dont `user_id` vaut
  `auth.uid()`.
- Le rôle `anon` n'a aucun droit sur les tables. Le rôle `authenticated` n'a
  que les droits nécessaires, bornés par la RLS.
- La clé service role contourne la RLS. Elle n'est utilisée que côté serveur,
  dans les contrôles de `/admin`, et n'est jamais exposée au navigateur.

Ces règles ont été vérifiées avec deux comptes : un second utilisateur ne voit
aucune ligne du premier, et une insertion sur la checklist du premier est
refusée.

## Lancer le projet en local

Prérequis : Node.js 20.9 ou plus (exigence de Next.js 16), pnpm, un projet
Supabase, une base Upstash Redis et une clé d'API pour le modèle.

```bash
pnpm install
cp .env.example .env.local
# renseigner les variables dans .env.local
pnpm dev
```

Le schéma se crée une seule fois dans le SQL Editor Supabase :

- sur une base neuve, exécuter `supabase/migrations/0001_init.sql` ;
- sur une base créée avant l'ajout de `user_id` sur `checklist_pokemon`,
  exécuter `supabase/migrations/0002_checklist_pokemon_user_id.sql`.

### Confirmation d'e-mail

Deux configurations fonctionnent.

Sans confirmation : dans Supabase, ouvrir Authentication → Providers → Email
et désactiver « Confirm email ». L'inscription ouvre alors une session et le
formulaire redirige directement vers l'accueil. C'est la configuration la plus
simple, et la seule praticable sur un nouveau projet gratuit : depuis juin 2026,
Supabase interdit la modification des templates d'e-mail sans SMTP personnalisé.

Avec confirmation : configurer un SMTP personnalisé, puis ouvrir
Authentication → Emails → Confirm signup et remplacer le lien par :

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">
  Confirmer mon adresse
</a>
```

`Site URL` doit pointer vers l'adresse de l'application (localhost en local,
URL Vercel en production). La route `/auth/confirm` vérifie le token hash et
fonctionne depuis n'importe quel navigateur. L'ancien `/auth/callback` reste en
secours, mais exige d'ouvrir le lien dans le navigateur qui a lancé
l'inscription, sinon Supabase répond `pkce_code_verifier_not_found`.

Pour accéder à `/admin`, il faut ensuite attribuer le rôle admin à un compte :

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

### Variables d'environnement

Le fichier `.env.example` liste toutes les variables, sans valeur.

| Variable | Rôle | Exposée au navigateur |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Oui |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique, protégée par la RLS | Oui |
| `SUPABASE_SECRET_KEY` | Clé service role, contourne la RLS | Non |
| `AI_BASE_URL` | Endpoint compatible OpenAI | Non |
| `AI_API_KEY` | Clé du fournisseur IA | Non |
| `AI_MODEL` | Modèle appelé par l'assistant | Non |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Cache et quotas | Non |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL` | Traces de l'IA | Non |
| `UPTIMEROBOT_API_KEY` | Lecture des monitors dans `/admin`, clé en lecture seule | Non |
| `ALLOWED_DEV_ORIGINS` | Hôtes autorisés à charger le serveur de développement | Non |

Les anciens noms `AI_PROVIDER_URL` et `AI_MODEL_NAME` restent acceptés.

Commandes utiles :

```bash
pnpm lint
pnpm build
pnpm langfuse:sync-model   # synchronise le prix du modèle dans Langfuse
```

## Limites et améliorations possibles

- Pas de tests automatisés ni de CI.
- Les checklists ne sont pas partageables entre utilisateurs.
- Pas de renommage ni de suppression de checklist depuis l'interface.
- `revision` est prévue pour suivre les versions d'une checklist, mais n'est pas
  encore mise à jour.
- Le Pokédex est chargé en entier puis filtré côté client. Une pagination serait
  nécessaire pour des listes plus longues.
- L'assistant n'a pas de streaming et se limite à 10 messages par heure et par
  utilisateur.
- Le CSV des noms français n'est pas contrôlé dans `/admin` ; seules ses erreurs
  remontent à l'utilisateur.
- Une indisponibilité de PokéAPI dégrade le premier chargement d'un Pokédex,
  avant que le cache Redis ne prenne le relais.
