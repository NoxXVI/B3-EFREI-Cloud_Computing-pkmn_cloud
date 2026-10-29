import type { NextConfig } from "next";

// Hôtes supplémentaires autorisés à charger les ressources de dev (HMR
// compris). Propre à chaque machine : la valeur vit dans .env.local, pas ici.
const devOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: devOrigins,
  async redirects() {
    return [
      {
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
