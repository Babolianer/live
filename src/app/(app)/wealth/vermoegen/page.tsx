import { requireSessionUser } from "@/lib/auth";
import { listWealthGroups } from "@/lib/wealth-groups";
import { listWealthAssets } from "@/lib/wealth-assets";
import { listWealthSectors } from "@/lib/wealth-sectors";
import { WealthGroupSection } from "@/components/wealth/wealth-group-section";
import { NewWealthGroupCard } from "@/components/wealth/new-wealth-group-card";
import { WealthCsvImportForm } from "@/components/wealth/wealth-csv-import-form";

export default async function WealthGroupsPage() {
  const user = await requireSessionUser();
  const [groups, assets, sectors] = await Promise.all([
    listWealthGroups(user.id),
    listWealthAssets(user.id),
    listWealthSectors(user.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      {groups.length === 0 && (
        <p className="py-4 text-center text-sm text-foreground-muted">
          Noch keine Vermögensgruppen — leg deine erste an (z. B. &bdquo;Girokonto&ldquo; oder &bdquo;Depot ING&ldquo;).
        </p>
      )}
      {groups.map((group) => (
        <WealthGroupSection
          key={group.id}
          group={group}
          assets={assets.filter((a) => a.group_id === group.id)}
          allGroups={groups}
          sectors={sectors}
        />
      ))}
      <NewWealthGroupCard />
      {groups.length > 0 && <WealthCsvImportForm groups={groups} assets={assets} />}
    </div>
  );
}
