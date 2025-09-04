import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Zap, Info, Search, AlertCircle, Loader2, CheckCircle, RefreshCw, BarChart2, Calendar, User, FileText, Lock, Bug, Database, ExternalLink } from 'lucide-react';
import { useEnedisData } from '../hooks/useEnedisData';
import EnhancedConsumptionChart from '../components/EnhancedConsumptionChart';
import EnedisInfoDisplay from '../components/EnedisInfoDisplay';
import AnnualLoadCurveDisplay from '../components/AnnualLoadCurveDisplay';
import AnnualConsumptionChart from '../components/AnnualConsumptionChart';
import DailyAveragePowerCurve from '../components/DailyAveragePowerCurve';
import AnnualLoadCurveTimeline from '../components/AnnualLoadCurveTimeline';
import { useLocation } from 'react-router-dom';
import { enedisApi } from '../utils/api/enedisApi';

const AbieLink: React.FC = () => {
  const location = useLocation();
  const [pdl, setPdl] = useState('');
  const [activeView, setActiveView] = useState<'info' | 'consumption' | 'loadCurve'>('info');
  const [additionalInfo, setAdditionalInfo] = useState<any>(null);
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  const {
    data,
    isLoading,
    isSectionLoading,
    error,
    success,
    setError,
    setSuccess,
    dataSource,
    progress,
    stage,
    fetchAllData,
    displayConsumptionData,
    displayLoadCurveData,
    displayMaxPowerData,
    getAnnualLoadCurveData
  } = useEnedisData();

  // Load PDL from localStorage on component mount
  useEffect(() => {
    const storedPdl = localStorage.getItem('enedis_usage_point_id');
    if (storedPdl) {
      setPdl(storedPdl);
    }

    // Check for success/error messages from navigation state
    if (location.state?.success) {
      setSuccess(location.state.message || 'Opération réussie');
    }
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location.state, setSuccess, setError]);

  const handlePdlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 14);
    setPdl(value);
  };

  const handleFetchAllData = async (pdlToUse: string) => {
    if (pdlToUse.length !== 14) {
      setError('Le PDL doit comporter 14 chiffres');
      return;
    }

    // Save PDL to localStorage
    localStorage.setItem('enedis_usage_point_id', pdlToUse);
    
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 Début de la récupération complète des données pour PDL:', pdlToUse);
      
      // Appeler fetchAllData du hook qui va récupérer toutes les données
      await fetchAllData(pdlToUse);
      
      // Récupérer les données client depuis Supabase après fetchAllData
      try {
        const [identity, address, contract, contact] = await Promise.all([
          enedisApi.getClientIdentityFromSupabase(pdlToUse),
          enedisApi.getClientAddressFromSupabase(pdlToUse),
          enedisApi.getClientContractFromSupabase(pdlToUse),
          enedisApi.getClientContactFromSupabase(pdlToUse),
        ]);
        
        // Construire l'objet complet avec toutes les données
        const completeClientData = {
          identity: identity,
          address: address,
          contract: contract,
          contact: contact
        };
        
        setAdditionalInfo(completeClientData);
        setError(null);
      } catch (supabaseError) {
        console.error('Erreur lors de la récupération des données client depuis Supabase:', supabaseError);
      }

      setSuccess('Toutes les données ont été récupérées avec succès');
      setActiveView('info');
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des données');
    }
  };

  const handleLoadCurveTabClick = () => {
    setActiveView('loadCurve');
    
    // Incrémenter le compteur de clics pour le debug
    const newCount = debugClickCount + 1;
    setDebugClickCount(newCount);
    
    // Activer le debug après 5 clics
    if (newCount >= 5) {
      setShowDebug(true);
    }
    
    // Reset du compteur après 10 secondes d'inactivité
    setTimeout(() => {
      setDebugClickCount(0);
    }, 10000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tête avec logo Enedis et dégradé inversé */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-400 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between text-white mb-4">
          <div className="flex items-center gap-3">
            <LinkIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Abie Link</h1>
          </div>
          <div className="flex items-center">
            <img 
              src="https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/graphique/Enedis-signature_couleur_RVB_72-dpi.png"
              alt="Enedis"
              className="h-12 w-auto"
            />
          </div>
        </div>
        <p className="text-blue-100">
          Connectez-vous à votre compteur Linky pour analyser votre consommation et optimiser votre installation solaire
        </p>
      </div>

      {/* Section explicative avec image compteur Linky */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Comment utiliser Abie Link ?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-900">Créer votre compte Enedis</h3>
                  <a 
                    href="https://mon-compte-client.enedis.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-sm text-gray-600">
                  Rendez-vous sur le site Enedis pour créer votre compte client et y rattacher votre PDL (Point de Livraison).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-900">Donner consentement à Abie Link</h3>
                  <a 
                    href="https://mon-compte-particulier.enedis.fr/dataconnect/v1/oauth2/authorize?client_id=Y_LuB7HsQW3JWYudw7HRmN28FN8a&duration=P1Y&response_type=code&state=AbieLink1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-sm text-gray-600">
                  Autorisez Abie Link à accéder à vos données de consommation via l'API sécurisée d'Enedis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Charger vos données de consommation</h3>
                <p className="text-sm text-gray-600">
                  Utilisez le formulaire ci-dessous pour récupérer et analyser vos données de consommation annuelle.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center ml-12 mt-4">
            <img 
              src="https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/graphique/PH709_071.png"
              alt="Compteur Linky"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>
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
          Configuration du Point de Livraison
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
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Le PDL (Point de Livraison) est un identifiant unique de 14 chiffres que vous trouverez sur votre facture d'électricité
            </p>
          </div>

          <button
            onClick={() => handleFetchAllData(pdl)}
            disabled={isLoading || pdl.length !== 14}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement en cours... {stage}</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Charger toutes les données</span>
              </>
            )}
          </button>
          
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">{stage}</span>
                <span className="text-sm text-blue-700">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveView('info')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeView === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Données client</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('consumption')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeView === 'consumption'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Consommation annuelle</span>
              </div>
            </button>
            <button
              onClick={handleLoadCurveTabClick}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeView === 'loadCurve'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>Courbe de charge annuelle</span>
              </div>
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">{stage}</p>
              <div className="mt-4 w-64 bg-gray-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeView === 'info' && (
              <>
                {additionalInfo ? (
                  <EnedisInfoDisplay data={additionalInfo} />
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700">Aucune donnée client disponible</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Cliquez sur "Charger toutes les données" pour récupérer les informations client.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeView === 'consumption' && (
              <>
                {displayConsumptionData.length > 0 ? (
                  <div data-chart="consumption">
                    <AnnualConsumptionChart 
                      data={displayConsumptionData}
                      maxPowerData={displayMaxPowerData}
                      loadCurveData={displayLoadCurveData}
                      loading={isSectionLoading('consumption')}
                      error={null}
                    />
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700">Aucune donnée de consommation disponible</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Cliquez sur "Charger toutes les données" pour récupérer les données de consommation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeView === 'loadCurve' && (
              <>
                {/* Debug info - Visible uniquement après 5 clics */}
                {showDebug && (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Debug - Informations sur les données</h4>
                      <div className="text-sm text-yellow-800 space-y-1">
                        <p><strong>Nombre de points :</strong> {displayLoadCurveData.length}</p>
                        <p><strong>Objectif théorique :</strong> 17,520 points (365 jours × 48 points/jour)</p>
                        <p><strong>Pourcentage d'atteinte :</strong> {((displayLoadCurveData.length / 17520) * 100).toFixed(1)}%</p>
                        {displayLoadCurveData.length > 0 && (
                          <>
                            <p><strong>Premier point :</strong> {displayLoadCurveData[0]?.date_time}</p>
                            <p><strong>Dernier point :</strong> {displayLoadCurveData[displayLoadCurveData.length - 1]?.date_time}</p>
                            <p><strong>Période couverte :</strong> {Math.ceil((new Date(displayLoadCurveData[displayLoadCurveData.length - 1]?.date_time).getTime() - new Date(displayLoadCurveData[0]?.date_time).getTime()) / (1000 * 60 * 60 * 24))} jours</p>
                            <p><strong>Couverture temporelle :</strong> {((Math.ceil((new Date(displayLoadCurveData[displayLoadCurveData.length - 1]?.date_time).getTime() - new Date(displayLoadCurveData[0]?.date_time).getTime()) / (1000 * 60 * 60 * 24)) / 365) * 100).toFixed(1)}% de l'année</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Debug data - Échantillon des données */}
                    {displayLoadCurveData.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Debug - Échantillon des données (50 premiers points)</h4>
                        <pre className="text-xs bg-green-100 p-3 rounded overflow-auto max-h-40">
                          {JSON.stringify(displayLoadCurveData.slice(0, 50), null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                )}

                {displayLoadCurveData.length > 0 ? (
                  <>
                    <div data-chart="daily-average-power">
                      <DailyAveragePowerCurve 
                        data={displayLoadCurveData}
                        title="Courbe de puissances journalière moyenne"
                      />
                    </div>
                    <div data-chart="load-curve">
                      <AnnualLoadCurveTimeline 
                        data={displayLoadCurveData}
                        title="Courbe de charge chronologique (365 jours)"
                      />
                    </div>
                    <div data-chart="annual-load-curve">
                      <AnnualLoadCurveDisplay 
                        data={displayLoadCurveData}
                        title="Analyse annuelle de la courbe de charge"
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700">Aucune donnée de courbe de charge disponible</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Cliquez sur "Charger toutes les données" pour récupérer la courbe de charge annuelle.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AbieLink;