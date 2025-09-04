import React, { useState } from 'react';
import { exitTermsData } from '../data/exitTermsData';
import ExitTermsTable from '../components/ExitTerms/ExitTermsTable';
import ExitTermsInfo from '../components/ExitTerms/ExitTermsInfo';

export default function ExitTerms() {
  const [selectedPower, setSelectedPower] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Modalités de sortie
      </h1>

      <div className="flex justify-end mb-4">
        <select 
          value={selectedPower}
          onChange={(e) => setSelectedPower(Number(e.target.value))}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {exitTermsData.map((data, index) => (
            <option key={data.puissance} value={index}>
              {data.puissance} kWc
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ExitTermsTable data={exitTermsData[selectedPower]} />
      </div>

      <ExitTermsInfo />
    </div>
  );
}