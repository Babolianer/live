"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
          <AlertTriangle size={22} />
        </div>
        <h1 className="font-heading text-xl font-semibold">Etwas ist schiefgelaufen</h1>
        <p className="mt-1 mb-5 text-sm text-foreground-muted">
          Ein unerwarteter Fehler ist aufgetreten. Versuch es bitte noch einmal.
        </p>
        <Button className="w-full" onClick={reset}>
          Erneut versuchen
        </Button>
      </Card>
    </div>
  );
}
