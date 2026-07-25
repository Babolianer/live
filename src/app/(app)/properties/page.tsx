import { requireSessionUser } from "@/lib/auth";
import { listProperties } from "@/lib/properties";
import { listDocuments } from "@/lib/documents";
import { PropertyItem } from "@/components/properties/property-item";
import { NewPropertyCard } from "@/components/properties/new-property-card";

export default async function PropertiesPage() {
  const user = await requireSessionUser();
  const [properties, documents] = await Promise.all([
    listProperties(user.id),
    listDocuments(user.id),
  ]);
  const documentOptions = documents.map((d) => ({ id: d.id, original_name: d.original_name }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Immobilien</h1>
        <p className="text-sm text-foreground-muted">
          Deine Immobilien, Werte und verknüpften Verträge im Blick.
        </p>
      </div>

      <NewPropertyCard documents={documentOptions} />

      <div className="flex flex-col gap-3">
        {properties.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            Noch keine Immobilien erfasst.
          </p>
        ) : (
          properties.map((p) => (
            <PropertyItem key={p.id} property={p} documents={documentOptions} />
          ))
        )}
      </div>
    </div>
  );
}
