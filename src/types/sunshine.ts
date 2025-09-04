export interface SunshineData {
  code_departement: string;
  nom_departement: string;
  ensoleillement: number; // en kWh/m2/an
  annee: number;
}

export interface SunshineState {
  data: SunshineData[];
  loading: boolean;
  error: string | null;
}