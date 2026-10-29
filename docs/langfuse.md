# Observabilité Langfuse

L'assistant Pokédex (`/api/chat` → `src/lib/ia.ts`) envoie ses traces à
[Langfuse](https://langfuse.com) : conversation, appels au modèle, appels
d'outils, tokens consommés et coût estimé.

## Variables d'environnement

À placer dans `.env.local` (valeurs déjà présentes dans le projet) :

```dotenv
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

Si l'une de ces variables manque, l'observabilité est désactivée et le chat
continue de fonctionner normalement.

## Prix du modèle

Langfuse calcule le coût à partir des tokens et du prix déclaré pour le modèle.
Le projet utilise `AI_MODEL` (par défaut `deepseek-v4.1-flash`) via
l'inférence OpenCode. Aucun modèle DeepSeek n'est fourni par défaut par
Langfuse : il faut donc créer la définition de prix.

```bash
pnpm langfuse:sync-model
```

Le script `scripts/sync-langfuse-model.mjs` :

1. lit `https://models.dev/api.json`, le catalogue utilisé par OpenCode ;
2. récupère le modèle `opencode/$AI_MODEL` ;
3. crée ou remplace la définition de modèle dans Langfuse avec les prix par
   token (`input`, `output`, `input_cache_read`, `output_reasoning`).

La commande est idempotente : elle peut être relancée quand les prix changent.
Pour un autre provider du catalogue, définir `LANGFUSE_MODEL_PROVIDER`.

## Ce qui est envoyé

- une trace par requête `/api/chat` ;
- `sessionId` : en-tête `x-chat-session` envoyé par le drawer de chat ;
- `userId` : identifiant Supabase de l'utilisateur connecté (sinon absent) ;
- tags `chat` et `pokedex-filters` ;
- les spans LangChain : agent, génération du modèle et outil `apply_filters`.

Le contenu des messages (et le prompt système) est envoyé à Langfuse. Ne pas
activer l'intégration sur des données qui ne doivent pas quitter
l'infrastructure.

## Coût : catalogue ou facturé ?

Deux notions coexistent dans la réponse OpenCode :

- `usage.opencode.list_cost` : prix catalogue de la consommation ;
- `usage.cost` : montant réellement facturé (peut être `0` quand l'allocation
  OpenCode couvre l'appel).

Langfuse affiche le **coût catalogue**, calculé à partir des prix synchronisés.
C'est une estimation stable, adaptée au suivi de consommation, mais ce n'est pas
la facture réelle.

## Vérifier

1. Lancer `pnpm dev`.
2. Envoyer un message dans l'assistant.
3. Ouvrir le projet Langfuse → **Tracing** : la trace `chat-agent` doit
   apparaître avec la génération, les tokens et le coût.

Si aucune trace n'apparaît :

- vérifier que les trois variables `LANGFUSE_*` sont chargées ;
- vérifier que `LANGFUSE_BASE_URL` correspond à la région du projet ;
- relancer `pnpm langfuse:sync-model` si le coût est vide.
