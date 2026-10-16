import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        // Il n'existe pas de route index pour /checklists : l'accueil liste déjà
        // les checklists. `redirects` est évalué avant le proxy (cf. doc Next),
        // donc c'est un vrai 307 servi avant toute logique d'auth.
        source: "/checklists",
        destination: "/",
        permanent: false,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
