const PRIX_KWH = 0.25; // Prix du kWh première année
const PRIX_REVENTE = 0.1269; // Prix de revente du surplus

export function calculateFinancialBenefits(
  production: number,
  tauxAutoconsommation: number
) {
  // Calcul de l'énergie autoconsommée et revendue
  const energieAutoconsommee = (production * tauxAutoconsommation) / 100;
  const energieRevendue = production - energieAutoconsommee;

  // Calcul des économies
  const economiesAnnuelles = energieAutoconsommee * PRIX_KWH;
  const reventeAnnuelle = energieRevendue * PRIX_REVENTE;

  return {
    economiesAnnuelles: Math.round(economiesAnnuelles),
    reventeAnnuelle: Math.round(reventeAnnuelle)
  };
}