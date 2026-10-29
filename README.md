# Pokémon Cloud

Application de suivi de Pokédex : chaque utilisateur crée des checklists par
jeu, coche les Pokémon capturés et peut piloter les filtres du tableau avec un
assistant IA.

## Présentation

L'application s'adresse aux joueurs qui veulent suivre leur progression sur
plusieurs jeux Pokémon sans tenir de tableur. Une checklist est rattachée à un
jeu (Pokémon Rouge, Saphir, Diamant, Noir 2, etc.) et reprend le Pokédex régional ou national
correspondant.

Fonctionnalités principales :

- inscription et connexion par e-mail / mot de passe via Supabase Auth ;
- création de checklists par jeu ;
- recherche, filtre par état de capture (capturé, non capturé, absent) et
  bascule entre Pokédex régional et national ;
- fiche Pokémon : types, évolutions, conditions d'obtention, rencontres ;
- assistant IA qui applique les filtres du tableau à partir d'une demande en
  langage naturel ;
- panneau `/admin` réservé aux administrateurs, avec l'état des services.

## Adresse de production

https://b3-efrei-cloud-computing-pkmn-cloud.vercel.app/

## Architecture

| Service | Rôle |
| --- | --- |
| Next.js 16 (App Router) sur Vercel | Interface, routes API, proxy d'authentification |
| Supabase Auth | Inscription, connexion, session par cookies |
| Supabase Postgres + RLS | Checklists et Pokémon capturés, isolés par utilisateur |
| Upstash Redis | Cache des Pokédex et des noms français, quota de l'assistant |
| OpenCode Inference (API compatible OpenAI) | Modèle de langage de l'assistant |
| LangChain | Agent et outil `apply_filters` |
| Langfuse | Traces des appels IA : tokens, latence, coût |
| UptimeRobot | Surveillance externe de `/api/health` et page de statut publique |
| PokéAPI + CSV PokeAPI | Données Pokémon et noms français |

Les appels à PokeAPI et au modèle d'IA passent uniquement par le serveur. Le
navigateur ne reçoit que les données nécessaires à l'affichage.

### Briques au choix

**Langfuse — observabilité de l'IA.** Chaque requête `/api/chat` produit une
trace Langfuse avec la génération, les tokens et le coût estimé. La brique est
pertinente parce que l'assistant est la fonctionnalité la plus coûteuse de
l'application : sans suivi, une dérive de consommation passerait inaperçue. Le
prix du modèle se synchronise avec `pnpm langfuse:sync-model`, et le détail de
la configuration figure dans `docs/langfuse.md`.

**UptimeRobot — surveillance externe.** La route publique `/api/health`
répond sans toucher à la base ni exposer de secret. Un monitor UptimeRobot la
vérifie à intervalle régulier et une page de statut publique rend l'état
visible hors de l'application. Le panneau `/admin` interroge l'API v2 en
lecture seule et signale tout monitor en panne. La brique est pertinente pour
une application déployée : elle détecte une indisponibilité Vercel ou Supabase
sans attendre qu'un utilisateur la signale.

La page de statut publique est accessible à l'adresse
https://stats.uptimerobot.com/48vgyRuscX.

## Modèle d'IA

Fournisseur : OpenCode, via son inférence compatible OpenAI
(`https://opencode.ai/inference/go/openai/v1` par défaut). Modèle :
`deepseek-v4.1-flash`. Les deux valeurs se configurent avec `AI_BASE_URL` et
`AI_MODEL`, et la clé avec `AI_API_KEY`.

L'appel se fait côté serveur, dans `src/lib/ia.ts`, avec LangChain. Le choix
du modèle tient à l'usage : l'agent ne dispose que de l'outil `apply_filters`
et n'a pas accès aux données Pokémon. Un modèle léger suffit donc pour
traduire une demande en filtres, ce que la prod confirme (le filtre est bien
appliqué). Le prompt demande à l'agent de ne pas inventer de données.

## Structure de données

Deux tables, reliées par une clé étrangère et protégées par RLS :

```text
auth.users
   │ 1
   │
   │ N
checklists (id, user_id, name, game_key, revision, created_at, updated_at)
   │ 1
   │
   │ N
checklist_pokemon (checklist_id, user_id, pokemon_api_id, is_captured, updated_at)
```

- `checklists.user_id` référence `auth.users(id)`; `checklist_pokemon.user_id`
  est relié au propriétaire par la clé étrangère composite vers
  `checklists(id, user_id)`.
- La clé étrangère composite `(checklist_id, user_id)` garantit qu'une ligne
  Pokémon appartient bien au propriétaire de la checklist.
- RLS est activée sur les deux tables. Les policies `select`, `insert`,
  `update` et `delete` comparent `user_id` à `auth.uid()`.
- Le client service role n'est utilisé que côté serveur, dans `/admin`, et
  contourne RLS par nature ; il n'est jamais exposé au navigateur.

Le schéma complet est versionné dans `supabase/migrations/0001_init.sql`. La
migration `0002_checklist_pokemon_user_id.sql` met à niveau une base créée
avant l'ajout de `user_id` sur `checklist_pokemon`.

## Lancer le projet en local

Prérequis : Node.js 20.9 ou plus (exigence de Next.js 16), pnpm, un projet
Supabase, une base Upstash Redis et une clé d'API pour le modèle.

```bash
pnpm install
cp .env.example .env.local
# renseigner les variables dans .env.local
pnpm dev
```

Appliquer le schéma dans le SQL Editor Supabase :

- base neuve : `supabase/migrations/0001_init.sql` ;
- base existante : `supabase/migrations/0002_checklist_pokemon_user_id.sql`.

Pour accéder à `/admin`, attribuer le rôle admin au compte :

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

Commandes utiles :

```bash
pnpm lint
pnpm build
pnpm langfuse:sync-model   # synchronise le prix du modèle dans Langfuse
```

Variables d'environnement : voir `.env.example`. Les clés `SUPABASE_SECRET_KEY`,
`AI_API_KEY`, `UPSTASH_REDIS_REST_TOKEN` et `LANGFUSE_SECRET_KEY` restent
strictement côté serveur.

## Limites et améliorations possibles

- Pas de tests automatisés ni de CI.
- Le CSV des noms français (raw.githubusercontent.com) ne figure pas dans
  `/admin` : seules ses erreurs remontent à l'utilisateur.
- Les checklists ne sont pas partageables entre utilisateurs.
- Pas encore de renommage ni de suppression de checklist depuis l'interface.
- Le Pokédex est chargé en entier puis filtré côté client ; une pagination
  serait nécessaire pour des listes plus grandes.
- L'assistant n'a pas de streaming et se limite à 10 messages par heure et par
  utilisateur.
- Les données viennent de PokeAPI et du dépôt PokeAPI : une indisponibilité de
  ces sources dégrade le premier chargement, avant que le cache Redis ne prenne
  le relais.
