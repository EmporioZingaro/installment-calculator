// src/fees.ts
// -----------------------------------------------------------------------------
// Pure‑logic module for installment‑price surcharge calculations.
// -----------------------------------------------------------------------------

/**
 * Single row inside the issuer JSON table.
 * Percentages are expressed as *percent* (e.g. 6.78, not 0.0678).
 */
export interface FeeRow {
  installments: number;
  mdr: number;       // MDR % for this tier
  rr: number;        // Rotativo Rate % for this tier
  total: number;     // Convenience: mdr + rr
}

/**
 * Shape of an issuer JSON file sitting in /public/data/*.json
 */
export interface IssuerTable {
  issuer: string;
  updated?: string;   // ISO date, optional meta
  parcelas: FeeRow[];
}

/**
 * Result object returned to the UI for each installment tier.
 */
export interface CalcResult {
  installments: number;
  feePercent: number;       // MDR+RR as percent (e.g. 8.52)
  surcharge: number;        // Δ – extra charged to customer (rounded ↑)
  finalPrice: number;       // P_base + surcharge (rounded ↑)
  perInstallment: number;   // value of each installment except possibly last
  extraPaidPercent: number; // (finalPrice / basePrice − 1) × 100 (rounded ↑)
}

// -----------------------------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------------------------

/**
 * Round *up* (ceiling) to the given number of decimal places.
 * A small negative epsilon is subtracted first to mitigate FP edge cases
 * where a value sits exactly on a decimal boundary (e.g. 10.67).
 */
export function roundUp(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.ceil((value - 1e-10) * factor) / factor;
}

// -----------------------------------------------------------------------------
// Core formula implementation
// -----------------------------------------------------------------------------

/**
 * Computes surcharge (Δ) and final price for one specific fee%.
 *
 * @param basePrice      Shelf price (already includes Simples on base MDR).
 * @param feePercent     MDR + RR total *as percent* (e.g. 8.52).
 * @param simplesPercent Simples Nacional as decimal (default 0.05 → 5 %).
 * @param decimals       Decimal places for monetary rounding (default 2).
 */
export function calcFinalPrice(
  basePrice: number,
  feePercent: number,
  simplesPercent = 0.05,
  decimals = 2
): { surcharge: number; finalPrice: number } {
  const F = feePercent / 100; // convert to decimal (0.0852)
  const T = simplesPercent;   // e.g. 0.05

  const delta = (F * basePrice) / (1 - (F + T));
  const final = basePrice + delta;

  return {
    surcharge: roundUp(delta, decimals),
    finalPrice: roundUp(final, decimals)
  };
}

// -----------------------------------------------------------------------------
// Comparison‑table builder (2× → 12×)
// -----------------------------------------------------------------------------

/**
 * Generates an array of `CalcResult` objects sorted by nº of installments.
 *
 * @param basePrice    Shelf price.
 * @param issuerTable  JSON block for the selected card brand.
 * @param simplesRate  Simples % as decimal (default 0.05).
 */
export function buildComparisonTable(
  basePrice: number,
  issuerTable: IssuerTable,
  simplesRate = 0.05
): CalcResult[] {
  return issuerTable.parcelas
    .map((row): CalcResult => {
      const { surcharge, finalPrice } = calcFinalPrice(
        basePrice,
        row.total,
        simplesRate
      );

      // Round each installment ↑ so customer never sees fractions of centavo.
      const per = roundUp(finalPrice / row.installments, 2);
      const extraPaidPercent = roundUp(((finalPrice / basePrice) - 1) * 100, 2);

      return {
        installments: row.installments,
        feePercent: row.total,
        surcharge,
        finalPrice,
        perInstallment: row.installments === 1 ? finalPrice : per,
        extraPaidPercent
      };
    })
    .sort((a, b) => a.installments - b.installments);
}

// -----------------------------------------------------------------------------
// Example usage (will be removed in production build)
// -----------------------------------------------------------------------------
/*
import visa from '../public/data/visa.json';
const table = buildComparisonTable(100, visa as IssuerTable);
console.table(table);
*/
