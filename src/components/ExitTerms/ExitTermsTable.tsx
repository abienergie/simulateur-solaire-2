import React from 'react';
import { ExitTerms } from '../../types/exitTerms';

interface ExitTermsTableProps {
  data: ExitTerms;
}

export default function ExitTermsTable({ data }: ExitTermsTableProps) {
  const durees = ["25 ans", "20 ans", "15 ans", "10 ans"];
  const years = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <caption className="text-lg font-semibold py-2">
          Puissance Crête : {data.puissance} kWc
        </caption>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durée
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mensualité
            </th>
            {years.map(year => (
              <th key={year} className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {durees.map((duree, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {duree}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {data.mensualites[index].toFixed(2)} €
              </td>
              {data.remboursements[index].map((value, i) => (
                <td 
                  key={i} 
                  className={`px-3 py-4 whitespace-nowrap text-sm text-right ${
                    i < 5 ? 'bg-gray-100 text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {value === 0 ? "-" : value === "-" ? "-" : `${value} €`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}