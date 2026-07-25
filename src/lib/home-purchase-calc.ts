import type { HomePurchaseCalculationInput, HomePurchaseCalculationResult } from "@/lib/wealth-types";

// Pure calculation, no DB access — safe to import from client components
// (e.g. the /wealth/hauskauf calculator page).
export function calculateHomePurchase(input: HomePurchaseCalculationInput): HomePurchaseCalculationResult {
  const additionalCostRate = input.grunderwerbsteuerPercent + input.notarPercent + input.maklerPercent;
  const totalAdditionalCosts = input.purchasePrice * (additionalCostRate / 100);
  const totalCashNeeded = totalAdditionalCosts + input.modernizationBudget + input.bufferAmount;
  const financingAmount = Math.max(input.purchasePrice + totalCashNeeded - input.availableEquity, 0);
  const monthlyRate = input.interestRatePercent / 100 / 12;
  const months = input.termYears * 12;
  const monthlyPayment =
    monthlyRate > 0
      ? (financingAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      : financingAmount / months;

  const percent = (part: number, total: number) => (total ? Math.round((part / total) * 1000) / 10 : 0);

  return {
    totalAdditionalCosts,
    totalCashNeeded,
    financingAmount,
    monthlyPayment,
    equityRatioPercent: percent(input.availableEquity, input.purchasePrice + totalCashNeeded),
  };
}
