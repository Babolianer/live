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

  const wealthEntries = await query<{ name: string; category: string; value: number }[]>(
    `SELECT name, category, value FROM wealth_entries WHERE user_id = ? ORDER BY value DESC`,
    [userId]
  );

  const vehicles = await query<
    { name: string; license_plate: string | null; value: number | null; inspection_due: string | null }[]
  >(
    `SELECT name, license_plate, value, inspection_due FROM vehicles WHERE user_id = ?`,
    [userId]
  );

  const properties = await query<
    { name: string; address: string | null; value: number | null }[]
  >(`SELECT name, address, value FROM properties WHERE user_id = ?`, [userId]);

  const recentHealthLogs = await query<
    { log_date: string; steps: number | null; water_liters: number | null; sleep_hours: number | null; workout: string | null }[]
  >(
    `SELECT log_date, steps, water_liters, sleep_hours, workout FROM health_logs
     WHERE user_id = ? ORDER BY log_date DESC LIMIT 7`,
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

  const totalWealth = wealthEntries.reduce((sum, w) => sum + w.value, 0);
  const wealthBlock = wealthEntries.length
    ? `Gesamtvermögen: ${totalWealth}€\n` +
      wealthEntries.map((w) => `- ${w.name} (${w.category}): ${w.value}€`).join("\n")
    : "Der Nutzer hat noch keine Vermögenswerte erfasst.";

  const vehiclesBlock = vehicles.length
    ? vehicles
        .map(
          (v) =>
            `- ${v.name}${v.license_plate ? ` (${v.license_plate})` : ""}${v.value ? `, Wert ${v.value}€` : ""}${v.inspection_due ? `, TÜV ${v.inspection_due}` : ""}`
        )
        .join("\n")
    : "Der Nutzer hat noch keine Fahrzeuge erfasst.";

  const propertiesBlock = properties.length
    ? properties
        .map((p) => `- ${p.name}${p.address ? ` (${p.address})` : ""}${p.value ? `, Wert ${p.value}€` : ""}`)
        .join("\n")
    : "Der Nutzer hat noch keine Immobilien erfasst.";

  const healthBlock = recentHealthLogs.length
    ? recentHealthLogs
        .map(
          (h) =>
            `- ${h.log_date}: ${h.steps ?? "?"} Schritte, ${h.water_liters ?? "?"}L Wasser, ${h.sleep_hours ?? "?"}h Schlaf${h.workout ? `, ${h.workout}` : ""}`
        )
        .join("\n")
    : "Der Nutzer hat noch keine Gesundheitsdaten erfasst.";

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

Wenn der Nutzer dich bittet, etwas anzulegen (Vertrag, Ziel, Vermögenswert, Fahrzeug, Immobilie oder Gesundheits-Eintrag — per Text oder durch Hochladen eines Dokuments/Fotos), rufe das passende Werkzeug auf ("propose_contract", "propose_goal", "propose_wealth_entry", "propose_vehicle", "propose_property" oder "propose_health_log"), statt es nur zu beschreiben. Fehlen Pflichtangaben, frage kurz danach, BEVOR du das Werkzeug aufrufst — rate nichts, was nicht im Dokument steht oder vom Nutzer genannt wurde. Der Nutzer sieht die vorgeschlagenen Daten danach in einem Formular und muss sie selbst bestätigen; du speicherst nichts direkt.

## Dokumente des Nutzers
${documentsBlock}

## Verträge des Nutzers
${contractsBlock}

## Ziele des Nutzers
${goalsBlock}

## Vermögen des Nutzers
${wealthBlock}

## Fahrzeuge des Nutzers
${vehiclesBlock}

## Immobilien des Nutzers
${propertiesBlock}

## Gesundheitsdaten der letzten 7 Tage
${healthBlock}

## Verfügbare Vergleichs-Tools
${toolsBlock}`;
}
