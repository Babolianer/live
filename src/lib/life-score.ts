import { query } from "@/lib/db";

export type LifeScoreBreakdown = {
  label: string;
  points: number;
  max: number;
};

export type LifeScore = {
  score: number;
  breakdown: LifeScoreBreakdown[];
};

/**
 * A real, transparent score computed from the user's actual data — never a
 * random or placeholder number. Each component is capped and documented so
 * the total (0-100) is fully explainable.
 */
export async function computeLifeScore(userId: string): Promise<LifeScore> {
  const [docCountRow, contractRows, goalRows, dueSoonRow, recentHealthRow] = await Promise.all([
    query<{ count: number }[]>(`SELECT COUNT(*) as count FROM documents WHERE user_id = ?`, [userId]),
    query<{ document_id: string | null }[]>(
      `SELECT document_id FROM contracts WHERE user_id = ?`,
      [userId]
    ),
    query<{ current_amount: number; target_amount: number; achieved_at: string | null }[]>(
      `SELECT current_amount, target_amount, achieved_at FROM goals WHERE user_id = ?`,
      [userId]
    ),
    query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM contracts
       WHERE user_id = ? AND cancellation_deadline IS NOT NULL
         AND cancellation_deadline BETWEEN date('now') AND date('now', '+30 days')`,
      [userId]
    ),
    query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM health_logs WHERE user_id = ? AND log_date >= date('now', '-7 days')`,
      [userId]
    ),
  ]);

  const documentCount = docCountRow[0]?.count ?? 0;
  const documentsPoints = Math.min(20, documentCount * 4);

  const totalContracts = contractRows.length;
  const linkedContracts = contractRows.filter((c) => c.document_id).length;
  const contractsPoints =
    totalContracts === 0 ? 20 : Math.round((20 * linkedContracts) / totalContracts);

  const totalGoals = goalRows.length;
  const onTrackGoals = goalRows.filter((g) => g.achieved_at || g.current_amount > 0).length;
  const goalsPoints = totalGoals === 0 ? 10 : Math.round((20 * onTrackGoals) / totalGoals);

  const dueSoonCount = dueSoonRow[0]?.count ?? 0;
  const dueSoonPoints = Math.max(0, 20 - dueSoonCount * 10);

  const hasRecentHealth = (recentHealthRow[0]?.count ?? 0) > 0;
  const healthPoints = hasRecentHealth ? 20 : 0;

  const breakdown: LifeScoreBreakdown[] = [
    { label: "Dokumente organisiert", points: documentsPoints, max: 20 },
    { label: "Verträge mit Dokument verknüpft", points: contractsPoints, max: 20 },
    { label: "Ziele on-track", points: goalsPoints, max: 20 },
    { label: "Kündigungsfristen im Blick", points: dueSoonPoints, max: 20 },
    { label: "Gesundheit diese Woche getrackt", points: healthPoints, max: 20 },
  ];

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);
  return { score, breakdown };
}
