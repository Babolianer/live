import Link from "next/link";
import { Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Compass size={22} />
        </div>
        <h1 className="font-heading text-xl font-semibold">Seite nicht gefunden</h1>
        <p className="mt-1 mb-5 text-sm text-foreground-muted">
          Diese Seite gibt es nicht (mehr). Lass uns dich zurück nach Hause bringen.
        </p>
        <Link href="/home" className="w-full">
          <Button className="w-full">Zur Startseite</Button>
        </Link>
      </Card>
    </div>
  );
}
