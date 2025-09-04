export interface ExitTerms {
  puissance: string;
  mensualites: number[];
  remboursements: (string | number)[][];
}

export interface PowerTerms {
  power: string;
  terms: {
    duration: number;
    monthlyPayment: number;
    yearlyValues: { [key: number]: number };
  }[];
}