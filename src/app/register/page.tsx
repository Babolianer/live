import { Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles size={22} />
          </div>
          <h1 className="font-heading text-xl font-semibold">Konto erstellen</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Starte mit LIFE — deiner KI für Dokumente, Verträge und Vermögen.
          </p>
        </div>
        <RegisterForm />
      </Card>
    </div>
  );
}
