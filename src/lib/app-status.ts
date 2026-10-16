export type Status = "operationnel" | "degrade" | "en_panne";

export type ControlResult = {
  service: string;
  description: string;
  status: Status;
  elapsedTimeMs: number;
  message: string;
};

export type Control = {
  service: string;
  description: string;
  verify: () => Promise<string>;
};

const MAX_DELAY_DURATION_MS = 5000;
const DEGRADATION_THRESHOLD_MS = 2000;

export async function executeControlCheck(control: Control): Promise<ControlResult> {
  const startTime = Date.now();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutExceeded = new Promise<never>((_, rejeter) => {
    timeoutHandle = setTimeout(
      () => rejeter(new Error(`Aucune réponse après ${MAX_DELAY_DURATION_MS / 1000} secondes`)),
      MAX_DELAY_DURATION_MS
    );
  });

  try {
    const message = await Promise.race([control.verify(), timeoutExceeded]);
    const elapsedTimeMs = Date.now() - startTime;

    return {
      service: control.service,
      description: control.description,
      status: elapsedTimeMs > DEGRADATION_THRESHOLD_MS ? "degrade" : "operationnel",
      elapsedTimeMs: elapsedTimeMs,
      message,
    };
  } catch (erreur) {
    return {
      service: control.service,
      description: control.description,
      status: "en_panne",
      elapsedTimeMs: Date.now() - startTime,
      message: erreur instanceof Error ? erreur.message : "Erreur inconnue",
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}