import { ShieldAlert } from "lucide-react";
import { requireSessionUser } from "@/lib/auth";
import { listPartnerTools } from "@/lib/partner-tools";
import { listUsers } from "@/lib/actions/admin-user-actions";
import { NewPartnerToolCard } from "@/components/admin/new-partner-tool-card";
import { PartnerToolItem } from "@/components/admin/partner-tool-item";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminPage() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
          <ShieldAlert size={22} />
        </div>
        <h1 className="font-heading text-xl font-semibold">Kein Zugriff</h1>
        <p className="text-sm text-foreground-muted">
          Dieser Bereich ist nur für Administratoren.
        </p>
      </div>
    );
  }

  const [tools, users] = await Promise.all([listPartnerTools(), listUsers()]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-foreground-muted">
          Partner-Tools und Nutzerverwaltung.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading font-semibold">Partner-Tools</h2>
          <p className="text-sm text-foreground-muted">
            Vergleichsrechner-Deep-Links (z. B. Check24), die Nutzern bei passenden
            Vertragskategorien angezeigt werden. Ohne konfiguriertes Tool wird nichts
            angezeigt — es gibt keine Fake-Links.
          </p>
        </div>
        <NewPartnerToolCard />
        <div className="flex flex-col gap-2">
          {tools.length === 0 ? (
            <p className="py-4 text-center text-sm text-foreground-muted">
              Noch keine Partner-Tools konfiguriert.
            </p>
          ) : (
            tools.map((t) => <PartnerToolItem key={t.id} tool={t} />)
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading font-semibold">Nutzer</h2>
          <p className="text-sm text-foreground-muted">
            Admin-Rolle vergeben oder entziehen.
          </p>
        </div>
        <UsersTable users={users} currentUser={user} />
      </section>
    </div>
  );
}
