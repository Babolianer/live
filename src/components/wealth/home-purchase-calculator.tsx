"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { calculateHomePurchase } from "@/lib/home-purchase-calc";

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

const DEFAULTS = {
  availableEquity: 50000,
  purchasePrice: 400000,
  grunderwerbsteuerPercent: 5,
  notarPercent: 1.5,
  maklerPercent: 3.57,
  modernizationBudget: 0,
  bufferAmount: 5000,
  interestRatePercent: 3.5,
  termYears: 25,
};

function formatEuro(value: number) {
  return `€ ${value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;
}

export function HomePurchaseCalculator() {
  const [input, setInput] = useState(DEFAULTS);

  const result = useMemo(() => calculateHomePurchase(input), [input]);

  function update(field: keyof typeof DEFAULTS) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setInput((prev) => ({ ...prev, [field]: Number.isFinite(value) ? value : 0 }));
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 font-heading font-semibold">Angaben</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Kaufpreis (€)</label>
            <input type="number" className={inputClass} value={input.purchasePrice} onChange={update("purchasePrice")} />
          </div>
          <div>
            <label className={labelClass}>Eigenkapital (€)</label>
            <input type="number" className={inputClass} value={input.availableEquity} onChange={update("availableEquity")} />
          </div>
          <div>
            <label className={labelClass}>Grunderwerbsteuer (%)</label>
            <input type="number" step="0.1" className={inputClass} value={input.grunderwerbsteuerPercent} onChange={update("grunderwerbsteuerPercent")} />
          </div>
          <div>
            <label className={labelClass}>Notar/Grundbuch (%)</label>
            <input type="number" step="0.1" className={inputClass} value={input.notarPercent} onChange={update("notarPercent")} />
          </div>
          <div>
            <label className={labelClass}>Makler (%)</label>
            <input type="number" step="0.1" className={inputClass} value={input.maklerPercent} onChange={update("maklerPercent")} />
          </div>
          <div>
            <label className={labelClass}>Modernisierung (€)</label>
            <input type="number" className={inputClass} value={input.modernizationBudget} onChange={update("modernizationBudget")} />
          </div>
          <div>
            <label className={labelClass}>Puffer (€)</label>
            <input type="number" className={inputClass} value={input.bufferAmount} onChange={update("bufferAmount")} />
          </div>
          <div>
            <label className={labelClass}>Zinssatz (%)</label>
            <input type="number" step="0.01" className={inputClass} value={input.interestRatePercent} onChange={update("interestRatePercent")} />
          </div>
          <div>
            <label className={labelClass}>Laufzeit (Jahre)</label>
            <input type="number" className={inputClass} value={input.termYears} onChange={update("termYears")} />
          </div>
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-heading font-semibold">Ergebnis</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground-muted">Kaufnebenkosten</span>
            <span className="font-medium">{formatEuro(result.totalAdditionalCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Benötigtes Bar-/Puffer-Kapital</span>
            <span className="font-medium">{formatEuro(result.totalCashNeeded)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Finanzierungsbedarf</span>
            <span className="font-medium">{formatEuro(result.financingAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-foreground-muted">Monatliche Rate</span>
            <span className="font-semibold">{formatEuro(result.monthlyPayment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Eigenkapitalquote</span>
            <span className="font-medium">{result.equityRatioPercent}%</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
