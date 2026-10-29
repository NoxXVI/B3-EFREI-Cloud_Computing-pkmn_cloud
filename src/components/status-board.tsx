"use client";

import { useEffect, useState } from "react";
import type { ControlResult, Status } from "@/lib/app-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiRefreshLine,
  RiErrorWarningLine,
} from "@remixicon/react";

type StatusResponse = {
  checkedAt: string;
  globalStatus: Status;
  services: ControlResult[];
};

const STATUSDISPLAY: Record<
  Status,
  {
    label: string;
    variant: "default" | "secondary" | "destructive";
    icon: typeof RiCheckboxCircleLine;
  }
> = {
  operational: {
    label: "Opérationnel",
    variant: "default",
    icon: RiCheckboxCircleLine,
  },
  degraded: {
    label: "Dégradé",
    variant: "secondary",
    icon: RiAlertLine,
  },
  down: {
    label: "En panne",
    variant: "destructive",
    icon: RiErrorWarningLine,
  },
};

const GLOBAL_MESSAGE: Record<Status, string> = {
  operational: "Tous les services sont opérationnels.",
  degraded: "Au moins un service répond lentement.",
  down: "Au moins un service est en panne.",
};

async function fetchStatus(): Promise<StatusResponse> {
  const response = await fetch("/api/admin/status", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Statut ${response.status}`);
  }

  return response.json();
}

export default function StatusBoard() {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function refresh() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchStatus();
      setStatusData(result);
    } catch {
      setErrorMessage("Impossible de joindre la route de statut.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchStatus()
      .then((result) => {
        if (!cancelled) {
          setStatusData(result);
          setErrorMessage("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Impossible de joindre la route de statut.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const globalStatus = statusData
    ? STATUSDISPLAY[statusData.globalStatus]
    : null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground mt-1">
            État des services et outils de diagnostic.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={refresh} disabled={isLoading}>
            <RiRefreshLine className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Vérification…" : "Relancer les tests"}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <RiErrorWarningLine />
          <AlertTitle>Erreur de vérification</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading && !statusData && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <RiLoader4Line className="animate-spin" />
            Vérification des services…
          </CardContent>
        </Card>
      )}

      {statusData && globalStatus && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                État général
                <Badge variant={globalStatus.variant}>
                  <globalStatus.icon />
                  {globalStatus.label}
                </Badge>
              </CardTitle>
              <CardDescription>
                {GLOBAL_MESSAGE[statusData.globalStatus]}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Détail des contrôles et temps de réponse.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>
                    Dernière vérification :{" "}
                    {new Date(statusData.checkedAt).toLocaleString("fr-FR")}
                  </TableCaption>

                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">
                        Temps de réponse
                      </TableHead>
                      <TableHead>Détail</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {statusData.services.map((service) => {
                      const status = STATUSDISPLAY[service.status];
                      const StatusIcon = status.icon;

                      return (
                        <TableRow key={service.service}>
                          <TableCell>
                            <div className="font-medium">{service.service}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.description}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant={status.variant}>
                              <StatusIcon />
                              {status.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {service.elapsedTimeMs} ms
                          </TableCell>

                          <TableCell className="min-w-48 text-muted-foreground">
                            {service.message}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
