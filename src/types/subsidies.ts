interface SubsidyRange {
  id: string;
  power_range: string;
  amount: number;
  effective_date: string;
}

export interface Subsidy {
  min: number;
  max: number;
  amount: number;
}

export type SubsidyRanges = Subsidy[];