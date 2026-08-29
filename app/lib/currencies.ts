export const CURRENCIES = [
  "XOF",
  "EUR",
  "USD",
  "CAD",
  "GBP",
  "GNF",
  "CDF",
  "MAD",
  "XAF",
] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<string, string> = {
  XOF: "Franc CFA BCEAO (XOF)",
  EUR: "Euro (EUR)",
  USD: "Dollar US (USD)",
  CAD: "Dollar canadien (CAD)",
  GBP: "Livre sterling (GBP)",
  GNF: "Franc guinéen (GNF)",
  CDF: "Franc congolais (CDF)",
  MAD: "Dirham marocain (MAD)",
  XAF: "Franc CFA BEAC (XAF)",
};
