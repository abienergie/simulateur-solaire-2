import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, AlertCircle, CheckCircle, User, Home, FileText, 
  Phone, Zap, BarChart2, Calendar, Database, RefreshCw, Shield
} from 'lucide-react';
import { enedisApiSeparate } from '../utils/api/enedisApiSeparate';

const EnedisApiTestSeparate: React.FC = () => {
  const [pdl, setPdl] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [results, setResults] = useState<{[key: string]: any}>({});
  const [errors, setErrors] = useState<{[key: string]: string | null}>({});

  // Load PDL from localStorage
  useEffect(() => {
    const storedPdl = localStorage.getItem('enedis_usage_point_id');
    if (storedPdl) {
      setPdl(storedPdl);
    }
    
    // Check if we have a token
    const accessToken = localStorage.getItem('enedis_access_token');
    const tokenExpires = localStorage.getItem('enedis_token_expires');
    
    if (accessToken) {
      setToken(accessToken);
      
      if (tokenExpires) {
        const expiryDate = new Date(tokenExpires);
        const now = new Date();
        
        if (expiryDate > now) {
          setTokenExpiry(expiryDate.toLocaleString());
        } else {
          setTokenExpiry('Expiré');
        }
      }
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
      alert(`PDL ${pdl} sauvegardé`);
    } else {
      alert('Le PDL doit comporter 14 chiffres');
    }
  };

  const startLoading = (key: string) => {
    setIsLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const stopLoading = (key: string) => {
    setIsLoading(prev => ({ ...prev, [key]: false }));
  };

  const setError = (key: string, error: string) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const setResult = (key: string, result: any) => {
    setResults(prev => ({ ...prev, [key]: result }));
  };

  const getApiToken = async () => {
    startLoading('token');
    try {
      const newToken = await enedisApiSeparate.getApiToken();
      if (newToken) {
        setToken(newToken);
        const tokenExpires = localStorage.getItem('enedis_token_expires');
        if (tokenExpires) {
          setTokenExpiry(new Date(tokenExpires).toLocaleString());
        }
        setResult('token', { success: true, token: newToken });
      } else {
        setError('token', 'Impossible d\'obtenir un token');
      }
    } catch (error) {
      setError('token', error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      stopLoading('token');
    }
  };

  const checkPdlAccess = async () => {
    if (!pdl || pdl.length !== 14) {
      alert('Veuillez saisir un PDL valide (14 chiffres)');
      return;
    }

    startLoading('connection');
    try {
      const result = await enedisApiSeparate.checkPdlAccess(pdl);
      setResult('connection', result);
      
      if (result === true) {
        // Success
      } else if (typeof result === 'object' && result.error) {
        setError('connection', result.error);
      } else {
        setError('connection', 'Test de connexion échoué');
      }
    } catch (error) {
      setError('connection', error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      stopLoading('connection');
    }
  };

  const getClientIdentity = async () => {
    if (!pdl || pdl.length !== 14) {
      alert('Veuillez saisir un PDL valide (14 chiffres)');
      return;
    }

    startLoading('identity');
    try {
      const result = await enedisApiSeparate.getClientProfile(pdl);
      setResult('identity', result);
    } catch (error) {
      setError('identity', error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      stopLoading('identity');
    }
  };

  const getConsumptionData = async () => {
    if (!pdl || pdl.length !== 14) {
      alert('Veuillez saisir un PDL valide (14 chiffres)');
      return;
    }

    startLoading('consumption');
    try {
      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const result = await enedisApiSeparate.getConsumptionData(pdl, formattedStartDate, formattedEndDate);
      setResult('consumption', result);
    } catch (error) {
      setError('consumption', error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      stopLoading('consumption');
    }
  };

  const renderTestButton = (
    key: string, 
    label: string, 
    icon: React.ReactNode, 
    onClick: () => void,
    description: string
  ) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium text-gray-900">{label}</h3>
          </div>
          <button
            onClick={onClick}
            disabled={isLoading[key]}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading[key] ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Test en cours...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Tester</span>
              </>
            )}
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        
        {errors[key] && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errors[key]}</p>
          </div>
        )}
        
        {results[key] && !errors[key] && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">
              {key === 'annual' && typeof results[key].progress === 'number' 
                ? `Progression: ${results[key].progress}%` 
                : key === 'all' && results[key].progress 
                  ? `${results[key].stage || 'Chargement'}: ${results[key].progress}%`
                  : 'Test réussi'}
            </p>
          </div>
        )}
        
        {results[key] && !isLoading[key] && (
          <div className="mt-2">
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                Voir les détails de la réponse
              </summary>
              <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-auto max-h-60">
                <pre className="text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(results[key], null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/abie-link"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à Abie Link
        </Link>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-3 text-white mb-4">
          <Database className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Tests API Enedis (Fonctions séparées)</h1>
        </div>
        <p className="text-blue-100">
          Cette page utilise des fonctions Edge séparées pour tester individuellement chaque endpoint de l'API Enedis.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Point de Livraison (PDL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pdl}
                onChange={handlePdlChange}
                placeholder="14 chiffres"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token d'authentification
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-mono text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                {token ? `${token.substring(0, 15)}...${token.substring(token.length - 10)}` : 'Aucun token'}
              </div>
              <button
                onClick={getApiToken}
                disabled={isLoading['token']}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isLoading['token'] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Obtenir</span>
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {tokenExpiry ? `Expire le: ${tokenExpiry}` : 'Aucun token ou expiré'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {renderTestButton(
          'connection',
          'Test de connexion (Nouvelle API)',
          <Shield className="h-5 w-5 text-blue-500" />,
          checkPdlAccess,
          'Vérifie si le PDL est accessible avec le token actuel (utilise la nouvelle fonction Edge séparée)'
        )}
        
        {renderTestButton(
          'identity',
          'Informations client (Nouvelle API)',
          <User className="h-5 w-5 text-green-500" />,
          getClientIdentity,
          'Récupère les informations d\'identité, d\'adresse, de contact et de contrat (utilise la nouvelle fonction Edge séparée)'
        )}
        
        {renderTestButton(
          'consumption',
          'Consommation quotidienne (Nouvelle API)',
          <Calendar className="h-5 w-5 text-purple-500" />,
          getConsumptionData,
          'Récupère les données de consommation quotidienne des 30 derniers jours (utilise la nouvelle fonction Edge séparée)'
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Informations sur les fonctions séparées
        </h3>
        <p className="text-blue-800 mb-4">
          Cette page utilise des fonctions Edge Supabase séparées pour chaque type de requête API Enedis.
          Cela permet d'isoler les problèmes et de simplifier le débogage.
        </p>
        <p className="text-sm text-blue-700">
          Chaque fonction a une responsabilité unique et claire, ce qui facilite la maintenance et améliore la fiabilité.
        </p>
      </div>
    </div>
  );
};

export default EnedisApiTestSeparate;