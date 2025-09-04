import React, { useState, useEffect } from 'react';
import { Database, User, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { enedisApi } from '../utils/api/enedisApi';

const Datahub: React.FC = () => {
  const [pdl, setPdl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  // Load PDL from localStorage on component mount
  useEffect(() => {
    const storedPdl = localStorage.getItem('enedis_usage_point_id');
    if (storedPdl) {
      setPdl(storedPdl);
      // Automatically load data if PDL is available
      if (storedPdl.length === 14) {
        handleGetClientIdentity(storedPdl);
      }
    }
  }, []);

  const handlePdlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accept only digits and limit to 14 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 14);
    setPdl(value);
  };

  const handleSavePdl = () => {
    if (pdl.length !== 14) {
      setError('Le PDL doit comporter 14 chiffres');
      return;
    }

    localStorage.setItem('enedis_usage_point_id', pdl);
    setSuccess(`PDL ${pdl} enregistré avec succès`);
    setTimeout(() => setSuccess(null), 3000);
    
    // Load data for the new PDL
    handleGetClientIdentity(pdl);
  };

  const handleGetClientIdentity = async (pdlToUse?: string) => {
    const pdlValue = pdlToUse || pdl;
    
    if (pdlValue.length !== 14) {
      setError('Le PDL doit comporter 14 chiffres');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Query Supabase directly
      console.log('Querying Supabase for client data...');
      
      // Utiliser la fonction enedisApi pour récupérer les données client
      const clientProfile = await enedisApi.getClientIdentityFromSupabase(pdlValue);
      
      if (clientProfile) {
        console.log('Data found:', clientProfile);
        setClientData(clientProfile);
        setDataSource('Base de données');
        setSuccess('Profil client récupéré avec succès');
      } else {
        // If no data in Supabase, show error
        throw new Error(`Aucune donnée disponible pour ce PDL. Veuillez contacter le support.`);
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du profil client');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-3 text-white mb-4">
          <Database className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Datahub</h1>
        </div>
        <p className="text-blue-100">
          Consultez les données associées à votre compteur Linky
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
                onClick={handleSavePdl}
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

          <button
            onClick={() => handleGetClientIdentity()}
            disabled={isLoading || pdl.length !== 14}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Récupération en cours...</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                <span>Récupérer les informations client</span>
              </>
            )}
          </button>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Pour tester, utilisez le PDL de test: <strong>14862373311505</strong>
            </p>
          </div>
        </div>
      </div>

      {clientData && (
        <>
        {dataSource && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700">Source des données : <strong>{dataSource}</strong></p>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Informations client
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identité */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-700" />
                Identité
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-blue-800">Civilité:</span>{' '}
                  <span className="text-blue-700">{clientData.identity?.natural_person?.title || clientData.identity?.title || 'Non disponible'}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-blue-800">Prénom:</span>{' '}
                  <span className="text-blue-700">{clientData.identity?.natural_person?.firstname || clientData.identity?.firstname || 'Non disponible'}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-blue-800">Nom:</span>{' '}
                  <span className="text-blue-700">{clientData.identity?.natural_person?.lastname || clientData.identity?.lastname || 'Non disponible'}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-blue-800">ID Client:</span>{' '}
                  <span className="text-blue-700">{clientData.identity?.customer_id || 'Non disponible'}</span>
                </p>
              </div>
            </div>

            {/* Adresse */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-green-700" />
                Adresse
              </h3>
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
              <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-700" />
                Contact
              </h3>
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
              <h3 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-700" />
                Contrat
              </h3>
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
        </>
      )}
    </div>
  );
};

export default Datahub;