export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false // Désactive les séparateurs de milliers
  }).format(amount);
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat('fr-FR', {
    useGrouping: false // Désactive les séparateurs de milliers
  }).format(number);
}

/**
 * Format a date to a French locale string (DD/MM/YYYY)
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}