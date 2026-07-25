import { Palette } from "lucide-react";
import { requireSessionUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";

export default async function SettingsPage() {
  const user = await requireSessionUser();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Einstellungen</h1>
        <p className="text-sm text-foreground-muted">Profil, Sicherheit und Darstellung.</p>
      </div>

      <ProfileForm user={user} />
      <PasswordForm />

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-foreground-muted" />
          <p className="font-heading font-semibold">Design</p>
        </div>
        <ThemeToggle />
      </Card>

      <DeleteAccountForm />
    </div>
  );
}
