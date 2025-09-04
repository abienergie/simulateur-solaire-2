import React, { useState, useEffect, useRef } from 'react';
import { FinancialProjection } from '../../types/financial';
import { formatCurrency } from '../../utils/formatters';
import html2canvas from 'html2canvas';

interface ProjectionTableProps {
  projection: FinancialProjection;
}

export default function ProjectionTable({ projection }: ProjectionTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  
  const hasSubscription = projection.projectionAnnuelle[0].coutAbonnement > 0;
  const prixFinal = projection.prixFinal;
  const showMyLight = projection.projectionAnnuelle[0].coutMyLight > 0;

  // Calculate totals for 20 years
  const first20Years = projection.projectionAnnuelle.slice(0, 20);
  const total20YearsEconomies = first20Years.reduce((sum, year) => sum + year.economiesAutoconsommation, 0);
  const total20YearsRevente = first20Years.reduce((sum, year) => sum + year.revenusRevente, 0);
  const total20YearsAbonnement = first20Years.reduce((sum, year) => sum + year.coutAbonnement, 0);
  const total20YearsMyLight = first20Years.reduce((sum, year) => sum + year.coutMyLight, 0);
  const total20YearsGain = first20Years.reduce((sum, year) => sum + year.gainTotal, 0);

  // Calculate totals for 30 years
  const total30YearsEconomies = projection.projectionAnnuelle.reduce((sum, year) => sum + year.economiesAutoconsommation, 0);
  const total30YearsRevente = projection.projectionAnnuelle.reduce((sum, year) => sum + year.revenusRevente, 0);
  const total30YearsAbonnement = projection.projectionAnnuelle.reduce((sum, year) => sum + year.coutAbonnement, 0);
  const total30YearsMyLight = projection.projectionAnnuelle.reduce((sum, year) => sum + year.coutMyLight, 0);
  const total30YearsGain = projection.projectionAnnuelle.reduce((sum, year) => sum + year.gainTotal, 0);

  // Capture the table for PDF on component mount
  useEffect(() => {
    const captureTableForPDF = async () => {
      if (!captureRef.current) return;
      
      try {
        // Capture only the first 20 years + total row
        const canvas = await html2canvas(captureRef.current, { 
          backgroundColor: 'white',
          useCORS: true,
          scrollY: -window.scrollY,
          scale: 5, // Revenir à une échelle de 5 pour un bon équilibre qualité/taille
          logging: false,
          allowTaint: true,
          foreignObjectRendering: false
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        localStorage.setItem('projection20ans_png', dataUrl);
        console.log('Projection table captured automatically for PDF with scale 5');
      } catch (error) {
        console.error('Error capturing projection table:', error);
      }
    };

    // Capture after a short delay to ensure rendering is complete
    const timer = setTimeout(() => {
      captureTableForPDF();
    }, 1000);

    return () => clearTimeout(timer);
  }, [projection]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div ref={tableRef} id="projection-30-ans" className="bg-white">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Projection financière sur 30 ans
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Production (kWh)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Autoconsommation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Surplus
                </th>
                {hasSubscription && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonnement
                  </th>
                )}
                {showMyLight && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MyLight
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gain total
                </th>
                {!hasSubscription && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rendement
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* This div is used for capturing only the first 20 years + total row for PDF */}
              <div ref={captureRef} style={{ position: 'absolute', left: '-9999px', width: '100%' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Année
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Production (kWh)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Autoconsommation
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Surplus
                      </th>
                      {hasSubscription && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Abonnement
                        </th>
                      )}
                      {showMyLight && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MyLight
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gain total
                      </th>
                      {!hasSubscription && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rendement
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projection.projectionAnnuelle.slice(0, 20).map((annee) => {
                      const rendement = !hasSubscription ? 
                        ((annee.economiesAutoconsommation + annee.revenusRevente) / prixFinal * 100) : 0;

                      return (
                        <tr key={annee.annee} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {annee.annee}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {Math.round(annee.production).toString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                            {formatCurrency(annee.economiesAutoconsommation)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                            {formatCurrency(annee.revenusRevente)}
                          </td>
                          {hasSubscription && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                              {annee.coutAbonnement > 0 ? formatCurrency(-annee.coutAbonnement) : '-'}
                            </td>
                          )}
                          {showMyLight && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                              {annee.coutMyLight > 0 ? formatCurrency(-annee.coutMyLight) : '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(annee.gainTotal)}
                          </td>
                          {!hasSubscription && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                              {rendement.toFixed(1)}%
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {/* Total row for 20 years */}
                    <tr className="bg-gray-100 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Total sur 20 ans
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatCurrency(total20YearsEconomies)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                        {formatCurrency(total20YearsRevente)}
                      </td>
                      {hasSubscription && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          {formatCurrency(-total20YearsAbonnement)}
                        </td>
                      )}
                      {showMyLight && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                          {formatCurrency(-total20YearsMyLight)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(total20YearsGain)}
                      </td>
                      {!hasSubscription && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                          -
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Display all 30 years in the actual visible table */}
              {projection.projectionAnnuelle.slice(0, 20).map((annee) => {
                const rendement = !hasSubscription ? 
                  ((annee.economiesAutoconsommation + annee.revenusRevente) / prixFinal * 100) : 0;

                return (
                  <tr key={annee.annee} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {annee.annee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {Math.round(annee.production).toString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {formatCurrency(annee.economiesAutoconsommation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                      {formatCurrency(annee.revenusRevente)}
                    </td>
                    {hasSubscription && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {annee.coutAbonnement > 0 ? formatCurrency(-annee.coutAbonnement) : '-'}
                      </td>
                    )}
                    {showMyLight && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                        {annee.coutMyLight > 0 ? formatCurrency(-annee.coutMyLight) : '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(annee.gainTotal)}
                    </td>
                    {!hasSubscription && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                        {rendement.toFixed(1)}%
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Total row for 20 years */}
              <tr className="bg-gray-100 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Total sur 20 ans
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                  {formatCurrency(total20YearsEconomies)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                  {formatCurrency(total20YearsRevente)}
                </td>
                {hasSubscription && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                    {formatCurrency(-total20YearsAbonnement)}
                  </td>
                )}
                {showMyLight && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                    {formatCurrency(-total20YearsMyLight)}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatCurrency(total20YearsGain)}
                </td>
                {!hasSubscription && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                    -
                  </td>
                )}
              </tr>

              {/* Years 21-30 */}
              {projection.projectionAnnuelle.slice(20).map((annee) => {
                const rendement = !hasSubscription ? 
                  ((annee.economiesAutoconsommation + annee.revenusRevente) / prixFinal * 100) : 0;

                return (
                  <tr key={annee.annee} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {annee.annee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {Math.round(annee.production).toString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {formatCurrency(annee.economiesAutoconsommation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                      {formatCurrency(annee.revenusRevente)}
                    </td>
                    {hasSubscription && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {annee.coutAbonnement > 0 ? formatCurrency(-annee.coutAbonnement) : '-'}
                      </td>
                    )}
                    {showMyLight && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                        {annee.coutMyLight > 0 ? formatCurrency(-annee.coutMyLight) : '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(annee.gainTotal)}
                    </td>
                    {!hasSubscription && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                        {rendement.toFixed(1)}%
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Total row for 30 years */}
              <tr className="bg-blue-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Total sur 30 ans
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                  {formatCurrency(total30YearsEconomies)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                  {formatCurrency(total30YearsRevente)}
                </td>
                {hasSubscription && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                    {formatCurrency(-total30YearsAbonnement)}
                  </td>
                )}
                {showMyLight && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                    {formatCurrency(-total30YearsMyLight)}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatCurrency(total30YearsGain)}
                </td>
                {!hasSubscription && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                    -
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}