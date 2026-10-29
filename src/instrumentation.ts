type LangfuseProcessor = {
  forceFlush(): Promise<void>;
};

type OtelGlobal = typeof globalThis & {
  __pkmnLangfuseOtelStarted?: boolean;
  __pkmnLangfuseSpanProcessor?: LangfuseProcessor;
};

/**
 * Initialise l'export OpenTelemetry vers Langfuse une seule fois par
 * instance de serveur Next.js. `@langfuse/langchain` ne fait qu'émettre des
 * spans : sans ce processor, aucune trace n'est envoyée à Langfuse.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  if (
    !process.env.LANGFUSE_PUBLIC_KEY ||
    !process.env.LANGFUSE_SECRET_KEY ||
    !process.env.LANGFUSE_BASE_URL
  ) {
    return;
  }

  const otelGlobal = globalThis as OtelGlobal;

  if (otelGlobal.__pkmnLangfuseOtelStarted) {
    return;
  }

  otelGlobal.__pkmnLangfuseOtelStarted = true;

  const [{ NodeSDK }, { LangfuseSpanProcessor }] = await Promise.all([
    import("@opentelemetry/sdk-node"),
    import("@langfuse/otel"),
  ]);

  const processor = new LangfuseSpanProcessor();
  otelGlobal.__pkmnLangfuseSpanProcessor = processor;

  const sdk = new NodeSDK({
    spanProcessors: [processor],
  });

  sdk.start();
}
