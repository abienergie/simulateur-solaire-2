import React from 'react';
import { FinancialProjection } from '../../types/financial';
import { formatCurrency } from '../../utils/formatters';
import { PiggyBank, TrendingUp, Leaf } from 'lucide-react';
import PropertyValueIncrease from './PropertyValueIncrease';

interface ProjectionSummaryProps {
  projection: FinancialProjection;
}

function getEquivalentExample(co2Savings: number): string {
  const kmVoiture = Math.round(co2Savings / 0.2);
  const arbres = Math.round(co2Savings / 25);
  const vols = (co2Savings / 1000).toFixed(1);

  return `${kmVoiture.toString()} km en voiture
          ou ${arbres} arbres plantés
          ou ${vols} vols Paris-New York`;
}

export default function ProjectionSummary({ projection }: ProjectionSummaryProps) {
  // Calcul des moyennes sur 20 ans
  const first20Years = projection.projectionAnnuelle.slice(0, 20);
  const moyenneEconomies = first20Years.reduce((sum, year) => sum + year.economiesAutoconsommation, 0) / 20;
  const moyenneRevente = first20Years.reduce((sum, year) => sum + year.revenusRevente, 0) / 20;
  const moyenneTotal = moyenneEconomies + moyenneRevente;

  // Calcul du rendement moyen sur 20 ans (uniquement pour le paiement comptant)
  const isSubscription = projection.projectionAnnuelle[0].coutAbonnement > 0;
  const rendementMoyen = !isSubscription ? (moyenneTotal / projection.prixFinal * 100) : null;

  // Calcul des économies de CO2 (60g CO2/kWh)
  const co2Savings = Math.round(projection.projectionAnnuelle[0].production * 0.06);

  // Récupération de la puissance crête depuis le prix de l'installation
  const puissanceCrete = projection.prixInstallation ? Math.round(projection.prixInstallation / 2500) : 0;

  // Debug log pour vérifier la puissance
  console.log('ProjectionSummary - puissanceCrete:', {
    prixInstallation: projection.prixInstallation,
    calculatedPower: puissanceCrete
  });

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Synthèse financière
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <PiggyBank className="h-6 w-6 text-green-500" />
            <h4 className="font-medium text-gray-900">Revenus moyens annuels (sur 20 ans)</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(moyenneTotal)}
          </p>
          <div className="mt-2 text-sm text-gray-600">
            <p>• Économies : {formatCurrency(moyenneEconomies)}</p>
            <p>• Revente : {formatCurrency(moyenneRevente)}</p>
            {!isSubscription && rendementMoyen && (
              <p className="mt-2 text-emerald-600 font-medium">
                Rendement moyen : {rendementMoyen.toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <h4 className="font-medium text-gray-900">Gains totaux sur 30 ans</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(projection.totalGains)}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Cumul des économies et de la revente
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Leaf className="h-6 w-6 text-emerald-500" />
            <h4 className="font-medium text-gray-900">Impact environnemental</h4>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {co2Savings.toString()} kg
          </p>
          <p className="mt-2 text-sm text-gray-600">
            CO₂ économisé par an, équivalent à :
            {getEquivalentExample(co2Savings)}
          </p>
        </div>

        <PropertyValueIncrease installedPower={projection.projectionAnnuelle[0].production / 1100} />
      </div>
    </div>
  );
}