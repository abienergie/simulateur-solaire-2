import React from 'react';
import { Info, User, Home, FileText, Phone, Calendar, BarChart2 } from 'lucide-react';
import EnhancedConsumptionChart from './EnhancedConsumptionChart';
import MonthlyConsumptionBarChart from './MonthlyConsumptionBarChart';

interface DataPreviewProps {
  data: any;
  type: 'profile' | 'consumption' | 'loadCurve';
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, type }) => {
  console.log(`Rendering DataPreview for type: ${type}`, data);
  
  if (!data) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-700">Aucune donnée disponible</p>
            <p className="text-sm text-blue-600 mt-1">
              Aucune donnée n'a été trouvée pour cette section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderProfile = () => {
    // Extraire les données d'identité
    let identity = {};
    if (data.identity && data.identity.natural_person) {
      identity = data.identity.natural_person;
    } else if (data.identity) {
      identity = data.identity;
    }
    
    // Extraire les données d'adresse
    const address = data.address || {};
    
    // Extraire les données de contrat
    const contract = data.contract || {};
    
    // Extraire les données de contact
    const contact = data.contact || {};
    
    console.log("Rendering profile with data:", { identity, address, contract, contact });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="pb-2 border-b">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Identité
              </h3>
            </div>
            <div className="pt-4">
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Civilité</dt>
                  <dd className="text-sm text-gray-900">{identity.title || identity.civilite || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Prénom</dt>
                  <dd className="text-sm text-gray-900">{identity.firstname || identity.prenom || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nom</dt>
                  <dd className="text-sm text-gray-900">{identity.lastname || identity.nom || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID Client</dt>
                  <dd className="text-sm text-gray-900">{data.identity?.customer_id || 'Non disponible'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="pb-2 border-b">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Home className="h-5 w-5 text-green-500" />
                Adresse
              </h3>
            </div>
            <div className="pt-4">
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rue</dt>
                  <dd className="text-sm text-gray-900">{address.street || address.rue || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Code postal</dt>
                  <dd className="text-sm text-gray-900">{address.postal_code || address.codePostal || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ville</dt>
                  <dd className="text-sm text-gray-900">{address.city || address.ville || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pays</dt>
                  <dd className="text-sm text-gray-900">{address.country || address.pays || 'France'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="pb-2 border-b">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Contrat
              </h3>
            </div>
            <div className="pt-4">
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Puissance souscrite</dt>
                  <dd className="text-sm text-gray-900">{contract.subscribed_power || contract.puissanceSouscrite || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type de compteur</dt>
                  <dd className="text-sm text-gray-900">{contract.meter_type || contract.typeCompteur || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Heures creuses</dt>
                  <dd className="text-sm text-gray-900">{contract.offpeak_hours || contract.heuresCreuses || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Statut du contrat</dt>
                  <dd className="text-sm text-gray-900">{contract.contract_status || contract.statutContrat || 'Non disponible'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="pb-2 border-b">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Phone className="h-5 w-5 text-amber-500" />
                Contact
              </h3>
            </div>
            <div className="pt-4">
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{contact.email || contact.courriel || 'Non disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                  <dd className="text-sm text-gray-900">{contact.phone || contact.telephone || 'Non disponible'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConsumption = () => {
    const consumption = data?.consumption || [];
    
    console.log("Rendering consumption with data:", consumption);
    
    if (consumption.length === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700">Aucune donnée de consommation</p>
              <p className="text-sm text-blue-600 mt-1">
                Aucune donnée de consommation n'a été trouvée pour cette période.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <EnhancedConsumptionChart data={consumption} />
        <MonthlyConsumptionBarChart data={consumption} />
      </div>
    );
  };

  const renderLoadCurve = () => {
    const loadCurve = data?.loadCurve || [];
    
    console.log("Rendering load curve with data:", loadCurve);
    
    if (loadCurve.length === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700">Aucune donnée de courbe de charge</p>
              <p className="text-sm text-blue-600 mt-1">
                Aucune donnée de courbe de charge n'a été trouvée pour cette période.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="pb-2 border-b">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              Courbe de charge
            </h3>
            <p className="text-sm text-gray-500">
              {loadCurve.length} points de données disponibles
            </p>
          </div>
          <div className="pt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heure
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur (kW)
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heures Creuses
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadCurve.slice(0, 10).map((point: any, index: number) => {
                    const isOffPeak = point.is_off_peak || point.isOffPeak || false;
                    
                    return (
                      <tr key={`${point.date}-${point.time}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(point.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {point.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {point.value.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {isOffPeak ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Oui
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Non
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {loadCurve.length > 10 && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Affichage des 10 premiers points sur {loadCurve.length} disponibles
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {type === 'profile' && renderProfile()}
      {type === 'consumption' && renderConsumption()}
      {type === 'loadCurve' && renderLoadCurve()}
    </div>
  );
};

export default DataPreview;