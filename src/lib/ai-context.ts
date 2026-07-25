import { query } from "@/lib/db";

const MAX_TEXT_PER_DOC = 4000;
const MAX_DOCS_IN_CONTEXT = 12;

export async function buildSystemPrompt(userId: string): Promise<string> {
  const documents = await query<
    { original_name: string; mime_type: string; extracted_text: string | null }[]
  >(
    `SELECT original_name, mime_type, extracted_text FROM documents
     WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, MAX_DOCS_IN_CONTEXT]
  );

  const contracts = await query<
    {
      name: string;
      category: string;
      amount: number | null;
      billing_cycle: string;
      contract_end: string | null;
      cancellation_deadline: string | null;
    }[]
  >(
    `SELECT name, category, amount, billing_cycle, contract_end, cancellation_deadline
     FROM contracts WHERE user_id = ? ORDER BY cancellation_deadline IS NULL, cancellation_deadline ASC`,
    [userId]
  );

  const documentsBlock = documents.length
    ? documents
        .map((doc) => {
          const text = doc.extracted_text
            ? doc.extracted_text.slice(0, MAX_TEXT_PER_DOC)
            : doc.mime_type.startsWith("image/")
              ? "(Bilddatei — kein Text extrahiert, nur Dateiname bekannt)"
              : "(Kein Text verfügbar)";
          return `### ${doc.original_name}\n${text}`;
        })
        .join("\n\n")
    : "Der Nutzer hat noch keine Dokumente hochgeladen.";

  const contractsBlock = contracts.length
    ? contracts
        .map((c) => {
          const amount = c.amount ? `${c.amount} € (${c.billing_cycle})` : "kein Betrag hinterlegt";
          const end = c.contract_end ? `Vertragsende: ${c.contract_end}` : "kein Vertragsende";
          const deadline = c.cancellation_deadline
            ? `Kündigungsfrist: ${c.cancellation_deadline}`
            : "keine Kündigungsfrist hinterlegt";
          return `- ${c.name} (${c.category}) — ${amount}, ${end}, ${deadline}`;
        })
        .join("\n")
    : "Der Nutzer hat noch keine Verträge angelegt.";

  return `Du bist "LIFE", ein persönlicher KI-Assistent, der Menschen hilft, Dokumente, Verträge und ihr digitales Leben zu organisieren.
Antworte auf Deutsch, freundlich, präzise und ohne unnötige Floskeln. Wenn du dir bei etwas nicht sicher bist oder die Information nicht in den bereitgestellten Daten steht, sag das ehrlich, statt zu raten.
Du hast KEINEN Zugriff auf Bankkonten, E-Mails oder externe Dienste — nur auf die unten aufgeführten Dokumente und Verträge des Nutzers.

## Dokumente des Nutzers
${documentsBlock}

## Verträge des Nutzers
${contractsBlock}`;
}
