import React from 'react';
import { Info, Package } from 'lucide-react';
import { PACKAGE_MAPPING } from '../utils/calculations/packageMapping';

// Exemples de packages iColl avec leurs IDs
const PACKAGE_EXAMPLES = [
  // 9K - Tous les abonnements
  { power: '9.0', duration: 25, id: '39', name: 'Centrale Photovoltaïque 9K - Abonnement 25 ans' },
  { power: '9.0', duration: 20, id: '40', name: 'Centrale Photovoltaïque 9K - Abonnement 20 ans' },
  { power: '9.0', duration: 15, id: '41', name: 'Centrale Photovoltaïque 9K - Abonnement 15 ans' },
  { power: '9.0', duration: 10, id: '81', name: 'Centrale Photovoltaïque 9K - Abonnement 10 ans' },
  
  // Autres exemples
  { power: '2.5', duration: 10, id: '44', name: 'Centrale Photovoltaïque 2,5K - Abonnement 10 ans' },
  { power: '3.0', duration: 15, id: '45', name: 'Centrale Photovoltaïque 3K - Abonnement 15 ans' },
  { power: '4.5', duration: 20, id: '31', name: 'Centrale Photovoltaïque 4.5K - Abonnement 20 ans' },
  { power: '5.5', duration: 25, id: '32', name: 'Centrale Photovoltaïque 5.5K - Abonnement 25 ans' }
];

export default function PackageExamples() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-900">Référence des packages iColl</h2>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Chaque combinaison de puissance et durée d'abonnement possède un identifiant unique dans le système iColl.
            Par exemple, pour une installation de 9 kWc, il existe 4 identifiants différents selon la durée d'abonnement.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puissance (kWc)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durée (ans)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Package
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom du package
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {PACKAGE_EXAMPLES.map((pkg, index) => (
              <tr key={`${pkg.power}-${pkg.duration}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pkg.power}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pkg.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono">
                  {pkg.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pkg.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mapping complet des packages</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700 mb-4">
            Chaque puissance (de 2.5 à 9.0 kWc) possède 4 identifiants différents, un pour chaque durée d'abonnement (10, 15, 20 et 25 ans).
          </p>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
{`const PACKAGE_MAPPING = {
  '2.5': {
    10: '44',
    15: '42',
    20: '43',
    25: '27'
  },
  '3.0': {
    10: '46',
    15: '45',
    20: '28',
    25: '47'
  },
  '3.5': {
    10: '50 
    15: '49',
    20: '48',
    25: '29'
  },
  '4.0': {
    10: '53',
    15: '52',
    20: '51',
    25: '30'
  },
  '4.5': {
    10: '56',
    15: '55',
    20: '31',
    25: '54'
  },
  '5.0': {
    10: '59',
    15: '58',
    20: '57',
    25: '19'
  },
  '5.5': {
    10: '62',
    15: '61',
    20: '60',
    25: '32'
  },
  '6.0': {
    10: '65',
    15: '64',
    20: '63',
    25: '33'
  },
  '6.5': {
    10: '68',
    15: '67',
    20: '66',
    25: '34'
  },
  '7.0': {
    10: '71',
    15: '70',
    20: '69',
    25: '35'
  },
  '7.5': {
    10: '74',
    15: '73',
    20: '72',
    25: '36'
  },
  '8.0': {
    10: '77',
    15: '76',
    20: '75',
    25: '37'
  },
  '8.5': {
    10: '80',
    15: '79',
    20: '78',
    25: '38'
  },
  '9.0': {
    10: '81',
    15: '41',
    20: '40',
    25: '39'
  }
}`}
          </pre>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Utilisation dans le code</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
{`// Exemple d'utilisation
const powerInKw = 9.0;
const duration = 25;

// Récupération de l'ID du package
const packageId = PACKAGE_MAPPING[powerInKw][duration];
// Résultat: '39'`}
          </pre>
        </div>
      </div>
    </div>
  );
}