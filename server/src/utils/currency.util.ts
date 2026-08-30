/**
 * Currency Minor Units Converter
 * Ensures exact conversion between standard currency units (e.g. INR Rupees)
 * and sub-units (e.g. INR Paise) required by Razorpay.
 */

export function toMinorUnits(amount: number, _currency = "INR"): number {
  if (isNaN(amount) || amount < 0) {
    throw new Error(`Invalid amount for minor units conversion: ${amount}`);
  }
  // Convert standard amount to smallest unit (e.g., INR 3499 -> 349900 paise)
  // Round to prevent floating point inaccuracies
  return Math.round(amount * 100);
}

export function fromMinorUnits(minorUnits: number, _currency = "INR"): number {
  if (isNaN(minorUnits) || minorUnits < 0) {
    throw new Error(`Invalid minor units for currency conversion: ${minorUnits}`);
  }
  return Number((minorUnits / 100).toFixed(2));
}
