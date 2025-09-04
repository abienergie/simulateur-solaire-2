/**
 * Fonction utilitaire pour obtenir le label d'un masque solaire
 * @param value Valeur du masque solaire (pourcentage de pertes)
 * @returns Label descriptif du masque solaire
 */
export function getShadingLabel(value: number): string {
  if (value === 0) return 'Aucun';
  if (value <= 5) return 'Léger';
  if (value <= 10) return 'Modéré';
  if (value <= 15) return 'Important';
  return 'Très important';
}