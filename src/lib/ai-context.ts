import { query } from "@/lib/db";
import { buildDeepLink } from "@/lib/deep-link";

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
      category: string;
      name: string;
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

  const goals = await query<
    {
      name: string;
      category: string;
      target_amount: number;
      current_amount: number;
      target_date: string | null;
      achieved_at: string | null;
    }[]
  >(
    `SELECT name, category, target_amount, current_amount, target_date, achieved_at
     FROM goals WHERE user_id = ? ORDER BY (achieved_at IS NOT NULL), created_at ASC`,
    [userId]
  );

  const partnerTools = await query<
    { category: string; provider_name: string; affiliate_id: string | null; deep_link_template: string }[]
  >(`SELECT category, provider_name, affiliate_id, deep_link_template FROM partner_tools WHERE enabled = 1`);

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

  const goalsBlock = goals.length
    ? goals
        .map((g) => {
          const percent = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
          const status = g.achieved_at ? "erreicht" : `${percent}% erreicht`;
          const date = g.target_date ? `, Zieldatum ${g.target_date}` : "";
          return `- ${g.name} (${g.category}): ${g.current_amount}€ / ${g.target_amount}€ — ${status}${date}`;
        })
        .join("\n")
    : "Der Nutzer hat noch keine Ziele angelegt.";

  const toolsBlock = partnerTools.length
    ? partnerTools
        .map((t) => `- Kategorie "${t.category}": ${t.provider_name} — ${buildDeepLink(t)}`)
        .join("\n")
    : "Aktuell sind keine Vergleichs-Tools hinterlegt.";

  return `Du bist "LIFE", ein persönlicher KI-Assistent, der Menschen hilft, Dokumente, Verträge, Ziele und ihr digitales Leben zu organisieren.
Antworte auf Deutsch, freundlich, präzise und ohne unnötige Floskeln. Wenn du dir bei etwas nicht sicher bist oder die Information nicht in den bereitgestellten Daten steht, sag das ehrlich, statt zu raten.
Du hast KEINEN Zugriff auf Bankkonten, E-Mails oder externe Dienste — nur auf die unten aufgeführten Daten des Nutzers.

Wenn ein Nutzer nach einem günstigeren Tarif fragt oder du bei einem Vertrag ein sinnvolles Sparpotenzial siehst, UND es für die passende Kategorie einen Eintrag unter "Verfügbare Vergleichs-Tools" gibt, darfst du proaktiv den echten Link daraus vorschlagen (niemals einen Link erfinden, der dort nicht steht). Gibt es keinen passenden Eintrag, sag das ehrlich, statt einen Anbieter zu erfinden.
Wenn ein Nutzer nach seinem Fortschritt bei einem Ziel fragt, nutze die Daten unter "Ziele des Nutzers".

Wenn der Nutzer dich bittet, einen Vertrag anzulegen (per Text oder durch Hochladen eines Vertragsdokuments/-fotos), rufe das Werkzeug "propose_contract" mit den erkannten Feldern auf, statt den Vertrag nur zu beschreiben. Fehlen Pflichtangaben (Name, Kategorie, Zahlungsintervall), frage kurz danach, BEVOR du das Werkzeug aufrufst — rate nichts, was nicht im Dokument steht oder vom Nutzer genannt wurde. Der Nutzer sieht die vorgeschlagenen Daten danach in einem Formular und muss sie selbst bestätigen; du speicherst nichts direkt.

## Dokumente des Nutzers
${documentsBlock}

## Verträge des Nutzers
${contractsBlock}

## Ziele des Nutzers
${goalsBlock}

## Verfügbare Vergleichs-Tools
${toolsBlock}`;
}
