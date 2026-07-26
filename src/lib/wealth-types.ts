import type { AssetTyp, GroupTyp } from "@/lib/wealth-asset-constants";

export interface WealthOverview {
  totalNetWorth: number;
  totalAssets: number;
  totalDebts: number;
  liquidAssets: number;
  investedAssets: number;
  changeThisMonthAbsolute: number;
  changeThisMonthPercent: number;
  asOf: string;
}

export interface AssetAllocationSlice {
  assetTyp: AssetTyp | "ALTERSVORSORGE";
  label: string;
  value: number;
  percent: number;
}

export type AssetAllocation = AssetAllocationSlice[];

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface SavingsGoalProgress {
  goalId: string;
  name: string;
  targetLabel: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  remaining: number;
  estimatedCompletionDate: string | null;
}

export interface SectorAllocation {
  sectorName: string;
  sectorColor: string;
  value: number;
  percent: number;
}

export interface TopPosition {
  id: string;
  name: string;
  symbol: string | null;
  assetTyp: AssetTyp;
  value: number;
  groupName: string;
}

export interface StaleAssetInfo {
  id: string;
  name: string;
  groupName: string;
  daysSinceUpdate: number | null;
  staleAfterDays: number;
}

export interface GroupSummary {
  id: string;
  name: string;
  typ: GroupTyp;
  farbe: string;
  icon: string;
  totalValue: number;
  assetCount: number;
}

export interface NetWorthSnapshotRow {
  id: string;
  date: string;
  net_worth: number;
  total_debts: number;
}

export interface WealthDashboardData {
  overview: WealthOverview;
  cards: { label: string; value: number }[];
  allocation: AssetAllocation;
  history: TimeSeriesPoint[];
  snapshots: NetWorthSnapshotRow[];
  goals: SavingsGoalProgress[];
  groups: GroupSummary[];
  staleAssets: StaleAssetInfo[];
  sectorAllocation: SectorAllocation[];
  topPositions: TopPosition[];
  diversificationScore: number;
}

export interface HomePurchaseCalculationInput {
  availableEquity: number;
  purchasePrice: number;
  grunderwerbsteuerPercent: number;
  notarPercent: number;
  maklerPercent: number;
  modernizationBudget: number;
  bufferAmount: number;
  interestRatePercent: number;
  termYears: number;
}

export interface HomePurchaseCalculationResult {
  totalAdditionalCosts: number;
  totalCashNeeded: number;
  financingAmount: number;
  monthlyPayment: number;
  equityRatioPercent: number;
}
