import { requireSessionUser } from "@/lib/auth";
import { listVehicles } from "@/lib/vehicles";
import { listDocuments } from "@/lib/documents";
import { VehicleItem } from "@/components/garage/vehicle-item";
import { NewVehicleCard } from "@/components/garage/new-vehicle-card";

export default async function GaragePage() {
  const user = await requireSessionUser();
  const [vehicles, documents] = await Promise.all([
    listVehicles(user.id),
    listDocuments(user.id),
  ]);
  const documentOptions = documents.map((d) => ({ id: d.id, original_name: d.original_name }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Garage</h1>
        <p className="text-sm text-foreground-muted">
          Deine Fahrzeuge, Werte und TÜV-Fristen im Blick.
        </p>
      </div>

      <NewVehicleCard documents={documentOptions} />

      <div className="flex flex-col gap-3">
        {vehicles.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            Noch keine Fahrzeuge erfasst.
          </p>
        ) : (
          vehicles.map((v) => <VehicleItem key={v.id} vehicle={v} documents={documentOptions} />)
        )}
      </div>
    </div>
  );
}
