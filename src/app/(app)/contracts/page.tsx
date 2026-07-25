import { requireSessionUser } from "@/lib/auth";
import { listContracts } from "@/lib/contracts";
import { listDocuments } from "@/lib/documents";
import { listPartnerTools } from "@/lib/partner-tools";
import { ContractItem } from "@/components/contracts/contract-item";
import { NewContractCard } from "@/components/contracts/new-contract-card";

export default async function ContractsPage() {
  const user = await requireSessionUser();
  const [contracts, documents, partnerTools] = await Promise.all([
    listContracts(user.id),
    listDocuments(user.id),
    listPartnerTools(),
  ]);

  const documentOptions = documents.map((d) => ({
    id: d.id,
    original_name: d.original_name,
  }));

  const enabledTools = partnerTools.filter((t) => t.enabled === 1);
  function toolForCategory(category: string) {
    return (
      enabledTools.find((t) => t.category === category) ??
      enabledTools.find((t) => t.category === "alle") ??
      null
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Verträge</h1>
        <p className="text-sm text-foreground-muted">
          Behalte Kosten und Kündigungsfristen im Blick.
        </p>
      </div>

      <NewContractCard documents={documentOptions} />

      <div className="flex flex-col gap-3">
        {contracts.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            Noch keine Verträge angelegt.
          </p>
        ) : (
          contracts.map((c) => (
            <ContractItem
              key={c.id}
              contract={c}
              documents={documentOptions}
              partnerTool={toolForCategory(c.category)}
            />
          ))
        )}
      </div>
    </div>
  );
}
