import React, { useState, useEffect } from 'react';
import { Database, User, Loader2, AlertCircle, CheckCircle, Calendar, BarChart2, Zap, FileText, Download, RefreshCw, Shield } from 'lucide-react';
import { enedisApi } from '../utils/api/enedisApi';

const EnedisDatahub: React.FC = () => {
  const [pdl, setPdl] = useState('');
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [consumptionData, setConsumptionData] = useState<any>(null);
  const [loadCurveData, setLoadCurveData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'identity' | 'consumption' | 'loadCurve'>('identity');
  const [rawData, setRawData] = useState<{[key: string]: any}>({});

  // Load PDL from localStorage
  useEffect(() => {
    const storedPdl = localStorage.getItem('enedis_usage_point_id');
    if (storedPdl) {
      setPdl(storedPdl);
    }
  }, []);

  const handlePdlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accept only digits and limit to 14 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 14);
    setPdl(value);
  };

  const savePdl = () => {
    if (pdl.length === 14) {
      localStorage.setItem('enedis_usage_point_id', pdl);
      setSuccess(`PDL ${pdl} sauvegardé`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('Le PDL doit comporter 14 chiffres');
      setTimeout(() => setError(null), 3000);
    }
  };

  const startLoading = (key: string) => {
    setIsLoading(prev => ({ ...prev, [key]: true }));
    setError(null);
    setSuccess(null);
  };

  const stopLoading = (key: string) => {
    setIsLoading(prev => ({ ...prev, [key]: false }));
  };

  const handleGetClientIdentity = async () => {
    if (!pdl || pdl.length !== 14) {
      setError('Le PDL doit comporter 14 chiffres');
      return;
    }

    startLoading('identity');
    try {
      // Essayer d'abord de récupérer depuis Supabase
      let result;
      try {
        result = await enedisApi.getClientIdentityFromSupabase(pdl);
        if (result) {
          console.log('Profil client récupéré depuis Supabase');
        }
      } catch (supabaseError) {
        console.error('Erreur lors de la récupération depuis Supabase:', supabaseError);
      }
      
      // Si pas de résultat depuis Supabase, essayer l'API Enedis
      if (!result) {
        result = await enedisApi.getClientProfile(pdl);
      }
      
      setClientData(result);
      setRawData(prev => ({ ...prev, identity: result }));
      setActiveTab('identity');
      setSuccess('Profil client récupéré avec succès');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération du profil client');
    } finally {
      stopLoading('identity');
    }
  };

  const handleGetConsumptionData = async () => {
    if (!pdl || pdl.length !== 14) {
      setError('Le PDL doit comporter 14 chiffres');
      return;
    }

    startLoading('consumption');
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const result = await enedisApi.getConsumptionData(pdl, formattedStartDate, formattedEndDate);
      setConsumptionData(result.consumption);
      setRawData(prev => ({ ...prev, consumption: result }));
      setActiveTab('consumption');
      setSuccess('Données de consommation récupérées avec succès');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération des données de consommation');
    } finally {
      stopLoading('consumption');
    }
  };

  const handleGetLoadCurve = async () => {
    if (!pdl || pdl.length !== 14) {
      setError('Le PDL doit comporter 14 chiffres');
      return;
    }

    startLoading('loadCurve');
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const result = await enedisApi.getConsumptionLoadCurve(pdl, formattedStartDate, formattedEndDate);
      setLoadCurveData(result.loadCurve);
      setRawData(prev => ({ ...prev, loadCurve: result }));
      setActiveTab('loadCurve');
      setSuccess('Courbe de charge récupérée avec succès');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération de la courbe de charge');
    } finally {
      stopLoading('loadCurve');
    }
  };

  const handleDownloadRawData = (key: string) => {
    if (!rawData[key]) return;
    
    const blob = new Blob([JSON.stringify(rawData[key], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enedis-${key}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderIdentityTab = () => {
    if (!clientData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune donnée d'identité disponible</p>
          <button
            onClick={handleGetClientIdentity}
            disabled={isLoading['identity']}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isLoading['identity'] ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                <span>Récupérer les données d'identité</span>
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Informations client</h3>
          <button
            onClick={() => handleDownloadRawData('identity')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Télécharger JSON</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identité */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-700" />
              Identité
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-blue-800">Civilité:</span>{' '}
                <span className="text-blue-700">{clientData.identity?.natural_person?.title || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-blue-800">Prénom:</span>{' '}
                <span className="text-blue-700">{clientData.identity?.natural_person?.firstname || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-blue-800">Nom:</span>{' '}
                <span className="text-blue-700">{clientData.identity?.natural_person?.lastname || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-blue-800">ID Client:</span>{' '}
                <span className="text-blue-700">{clientData.identity?.customer_id || 'Non disponible'}</span>
              </p>
            </div>
          </div>

          {/* Adresse */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-green-700" />
              Adresse
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-green-800">Rue:</span>{' '}
                <span className="text-green-700">{clientData.address?.street || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-green-800">Code postal:</span>{' '}
                <span className="text-green-700">{clientData.address?.postal_code || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-green-800">Ville:</span>{' '}
                <span className="text-green-700">{clientData.address?.city || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-green-800">Pays:</span>{' '}
                <span className="text-green-700">{clientData.address?.country || 'Non disponible'}</span>
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-700" />
              Contact
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-purple-800">Email:</span>{' '}
                <span className="text-purple-700">{clientData.contact?.email || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-purple-800">Téléphone:</span>{' '}
                <span className="text-purple-700">{clientData.contact?.phone || 'Non disponible'}</span>
              </p>
            </div>
          </div>

          {/* Contrat */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-700" />
              Contrat
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-amber-800">Puissance souscrite:</span>{' '}
                <span className="text-amber-700">{clientData.contract?.subscribed_power || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-amber-800">Type de compteur:</span>{' '}
                <span className="text-amber-700">{clientData.contract?.meter_type || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-amber-800">Heures creuses:</span>{' '}
                <span className="text-amber-700">{clientData.contract?.offpeak_hours || 'Non disponible'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-amber-800">Statut du contrat:</span>{' '}
                <span className="text-amber-700">{clientData.contract?.contract_status || 'Non disponible'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConsumptionTab = () => {
    if (!consumptionData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune donnée de consommation disponible</p>
          <button
            onClick={handleGetConsumptionData}
            disabled={isLoading['consumption']}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isLoading['consumption'] ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                <span>Récupérer les données de consommation</span>
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Consommation quotidienne</h3>
          <button
            onClick={() => handleDownloadRawData('consumption')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Télécharger JSON</span>
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Résumé</h4>
          <p className="text-sm text-gray-600">
            {consumptionData.length} jours de données disponibles
          </p>
          
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heures Pleines (kWh)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heures Creuses (kWh)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total (kWh)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consumptionData.slice(0, 10).map((day: any, index: number) => (
                  <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(day.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {day.peakHours.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {day.offPeakHours.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {(day.peakHours + day.offPeakHours).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {consumptionData.length > 10 && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              Affichage des 10 premiers jours sur {consumptionData.length} disponibles
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderLoadCurveTab = () => {
    if (!loadCurveData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune donnée de courbe de charge disponible</p>
          <button
            onClick={handleGetLoadCurve}
            disabled={isLoading['loadCurve']}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isLoading['loadCurve'] ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <BarChart2 className="h-5 w-5" />
                <span>Récupérer la courbe de charge</span>
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Courbe de charge</h3>
          <button
            onClick={() => handleDownloadRawData('loadCurve')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Télécharger JSON</span>
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Résumé</h4>
          <p className="text-sm text-gray-600">
            {loadCurveData.length} points de données disponibles
          </p>
          
          <div className="mt-4 overflow-x-auto">
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
                {loadCurveData.slice(0, 10).map((point: any, index: number) => (
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
                      {point.isOffPeak ? (
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
                ))}
              </tbody>
            </table>
          </div>
          
          {loadCurveData.length > 10 && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              Affichage des 10 premiers points sur {loadCurveData.length} disponibles
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-3 text-white mb-4">
          <Database className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Enedis Datahub</h1>
        </div>
        <p className="text-blue-100">
          Accédez aux données de votre compteur Linky pour optimiser votre installation solaire
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Configuration
        </h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="pdl-input" className="block text-sm font-medium text-gray-700 mb-1">
              Point de Livraison (PDL)
            </label>
            <div className="flex gap-2">
              <input
                id="pdl-input"
                type="text"
                value={pdl}
                onChange={handlePdlChange}
                placeholder="14 chiffres"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg tracking-wider"
                maxLength={14}
              />
              <button
                onClick={savePdl}
                disabled={pdl.length !== 14}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Sauvegarder
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {pdl.length}/14 chiffres
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleGetClientIdentity}
              disabled={isLoading['identity'] || pdl.length !== 14}
              className="flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
            >
              {isLoading['identity'] ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span>Profil client</span>
            </button>
            
            <button
              onClick={handleGetConsumptionData}
              disabled={isLoading['consumption'] || pdl.length !== 14}
              className="flex items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors disabled:opacity-50"
            >
              {isLoading['consumption'] ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Calendar className="h-5 w-5" />
              )}
              <span>Consommation</span>
            </button>
            
            <button
              onClick={handleGetLoadCurve}
              disabled={isLoading['loadCurve'] || pdl.length !== 14}
              className="flex items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors disabled:opacity-50"
            >
              {isLoading['loadCurve'] ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <BarChart2 className="h-5 w-5" />
              )}
              <span>Courbe de charge</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('identity')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'identity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profil client</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('consumption')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'consumption'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Consommation</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('loadCurve')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'loadCurve'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>Courbe de charge</span>
              </div>
            </button>
          </nav>
        </div>

        {activeTab === 'identity' && renderIdentityTab()}
        {activeTab === 'consumption' && renderConsumptionTab()}
        {activeTab === 'loadCurve' && renderLoadCurveTab()}
      </div>
    </div>
  );
};

export default EnedisDatahub;