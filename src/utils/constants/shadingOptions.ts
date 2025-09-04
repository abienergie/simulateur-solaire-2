export const SHADING_OPTIONS = [
  { value: 0, label: 'Aucun ombrage (0% de pertes)' },
  { value: 5, label: 'Ombrage léger - arbres éloignés (5% de pertes)' },
  { value: 10, label: 'Ombrage modéré - quelques arbres proches (10% de pertes)' },
  { value: 15, label: 'Ombrage important - bâtiments voisins (15% de pertes)' },
  { value: 20, label: 'Ombrage très important - environnement dense (20% de pertes)' }
] as const;