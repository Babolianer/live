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
      id: string;
      category: string;
      name: string;
      amount: number | null;
      billing_cycle: string;
      contract_end: string | null;
      cancellation_deadline: string | null;
    }[]
  >(
    `SELECT id, name, category, amount, billing_cycle, contract_end, cancellation_deadline
     FROM contracts WHERE user_id = ? ORDER BY cancellation_deadline IS NULL, cancellation_deadline ASC`,
    [userId]
  );

  const goals = await query<
    {
      id: string;
      name: string;
      category: string;
      target_amount: number;
      current_amount: number;
      target_date: string | null;
      achieved_at: string | null;
    }[]
  >(
    `SELECT id, name, category, target_amount, current_amount, target_date, achieved_at
     FROM goals WHERE user_id = ? ORDER BY (achieved_at IS NOT NULL), created_at ASC`,
    [userId]
  );

  const partnerTools = await query<
    { category: string; provider_name: string; affiliate_id: string | null; deep_link_template: string }[]
  >(`SELECT category, provider_name, affiliate_id, deep_link_template FROM partner_tools WHERE enabled = 1`);

  const wealthEntries = await query<{ id: string; name: string; category: string; value: number }[]>(
    `SELECT id, name, category, value FROM wealth_entries WHERE user_id = ? ORDER BY value DESC`,
    [userId]
  );

  const vehicles = await query<
    {
      id: string;
      name: string;
      license_plate: string | null;
      value: number | null;
      inspection_due: string | null;
    }[]
  >(
    `SELECT id, name, license_plate, value, inspection_due FROM vehicles WHERE user_id = ?`,
    [userId]
  );

  const properties = await query<
    { id: string; name: string; address: string | null; value: number | null }[]
  >(`SELECT id, name, address, value FROM properties WHERE user_id = ?`, [userId]);

  const recentHealthLogs = await query<
    {
      id: string;
      log_date: string;
      steps: number | null;
      water_liters: number | null;
      sleep_hours: number | null;
      workout: string | null;
    }[]
  >(
    `SELECT id, log_date, steps, water_liters, sleep_hours, workout FROM health_logs
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
          return `- [id: ${c.id}] ${c.name} (${c.category}) — ${amount}, ${end}, ${deadline}`;
        })
        .join("\n")
    : "Der Nutzer hat noch keine Verträge angelegt.";

  const goalsBlock = goals.length
    ? goals
        .map((g) => {
          const percent = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
          const status = g.achieved_at ? "erreicht" : `${percent}% erreicht`;
          const date = g.target_date ? `, Zieldatum ${g.target_date}` : "";
          return `- [id: ${g.id}] ${g.name} (${g.category}): ${g.current_amount}€ / ${g.target_amount}€ — ${status}${date}`;
        })
        .join("\n")
    : "Der Nutzer hat noch keine Ziele angelegt.";

  const totalWealth = wealthEntries.reduce((sum, w) => sum + w.value, 0);
  const wealthBlock = wealthEntries.length
    ? `Gesamtvermögen: ${totalWealth}€\n` +
      wealthEntries.map((w) => `- [id: ${w.id}] ${w.name} (${w.category}): ${w.value}€`).join("\n")
    : "Der Nutzer hat noch keine Vermögenswerte erfasst.";

  const vehiclesBlock = vehicles.length
    ? vehicles
        .map(
          (v) =>
            `- [id: ${v.id}] ${v.name}${v.license_plate ? ` (${v.license_plate})` : ""}${v.value ? `, Wert ${v.value}€` : ""}${v.inspection_due ? `, TÜV ${v.inspection_due}` : ""}`
        )
        .join("\n")
    : "Der Nutzer hat noch keine Fahrzeuge erfasst.";

  const propertiesBlock = properties.length
    ? properties
        .map(
          (p) =>
            `- [id: ${p.id}] ${p.name}${p.address ? ` (${p.address})` : ""}${p.value ? `, Wert ${p.value}€` : ""}`
        )
        .join("\n")
    : "Der Nutzer hat noch keine Immobilien erfasst.";

  const healthBlock = recentHealthLogs.length
    ? recentHealthLogs
        .map(
          (h) =>
            `- [id: ${h.id}] ${h.log_date}: ${h.steps ?? "?"} Schritte, ${h.water_liters ?? "?"}L Wasser, ${h.sleep_hours ?? "?"}h Schlaf${h.workout ? `, ${h.workout}` : ""}`
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

Jeder Eintrag unten hat eine [id: ...] — merke sie dir für "update_entity"/"delete_entity"-Aufrufe, zeige sie aber NIE dem Nutzer als Text (nur intern verwenden).

Wenn ein Nutzer nach einem günstigeren Tarif fragt oder du bei einem Vertrag ein sinnvolles Sparpotenzial siehst, UND es für die passende Kategorie einen Eintrag unter "Verfügbare Vergleichs-Tools" gibt, darfst du proaktiv den echten Link daraus vorschlagen (niemals einen Link erfinden, der dort nicht steht). Gibt es keinen passenden Eintrag, sag das ehrlich, statt einen Anbieter zu erfinden.
Wenn ein Nutzer nach seinem Fortschritt bei einem Ziel fragt, nutze die Daten unter "Ziele des Nutzers".

Der Nutzer kann über dich WIRKLICH ALLES verwalten — Verträge, Ziele, Vermögenswerte, Fahrzeuge, Immobilien und Gesundheits-Einträge:
- Neu anlegen: rufe SOFORT das passende Werkzeug auf ("propose_contract", "propose_goal", "propose_wealth_entry", "propose_vehicle", "propose_property" oder "propose_health_log"), sobald erkennbar ist, WAS angelegt werden soll — auch wenn nur der Name/die Art bekannt ist. Fehlende Detailangaben (Betrag, Datum, Kategorie, Zyklus, ...) NIEMALS als Fragenliste im Chat-Text abfragen. Ordne nur das eindeutig zu, was aus der Nachricht hervorgeht (z. B. "PHV" → Name "Privathaftpflichtversicherung", Kategorie "versicherung"), rate nichts Unbekanntes und lass alles andere einfach weg — der Nutzer sieht danach ein Formular mit sauberen, leeren Eingabefeldern für genau das, was noch fehlt, und ergänzt es dort direkt. Frage nur dann kurz in Textform nach, wenn völlig unklar ist, welche Art von Eintrag überhaupt gemeint ist (z. B. nur "leg mir was an" ganz ohne jeden Anhaltspunkt).
- Ändern (z. B. "erhöhe mein Depot auf 9000€", "ändere den TÜV-Termin meines Golfs"): rufe "update_entity" auf mit entityType, der passenden id aus der Liste oben und nur den geänderten Feldern in "changes".
- Löschen: rufe "delete_entity" auf mit entityType und id.
Bei "ändere/lösche X" aber unklar WELCHES X gemeint ist (mehrere Treffer), frage nach, statt zu raten. Nach jedem Werkzeug-Aufruf sieht der Nutzer die Änderung in einem Formular/einer Bestätigung und muss sie aktiv bestätigen — du speicherst und löschst nie direkt.

Für Immobilien- oder Vermögensfragen (z. B. Rendite, Wertentwicklung) darfst du mit den vorhandenen Zahlen (Wert, Kaufdatum) selbst rechnen und das Ergebnis transparent erklären — aber nur mit echten Werten aus den Daten unten, nichts schätzen ohne das klar zu kennzeichnen.

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
