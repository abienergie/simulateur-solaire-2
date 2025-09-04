import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../contexts/client';
import { calculerProduction } from '../utils/calculations/productionCalculator';
import { calculateRecommendation } from '../utils/calculations/recommendationCalculator';
import AddressForm from './AddressForm';
import SizingSection from './SizingSection';
import RecommendationDisplay from './RecommendationDisplay';
import InstallationSection from './InstallationSection';
import ResultsSection from './ResultsSection';
import NavigationButtons from './NavigationButtons';
import SunshineDisplay from './SunshineDisplay';
import GoogleMapsView from './GoogleMapsView';
import { useSolarData } from '../hooks/useSolarData';
import { RotateCcw } from 'lucide-react';

export default function SolarForm() {
  const navigate = useNavigate();
  const { clientInfo, updateClientInfo, address, updateAddress, resetClientInfo } = useClient();
  const { params, setParams, result, setResult, resetData } = useSolarData();
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculate = async () => {
      if (!params.adresse.codePostal || !params.consommationAnnuelle) {
        setResult(null);
        return;
      }
      
      setCalculating(true);
      setError(null);
      
      try {
        const results = await calculerProduction(params);
        const recommendation = calculateRecommendation({
          consommationAnnuelle: params.consommationAnnuelle,
          codePostal: params.adresse.codePostal,
          typeCompteur: params.typeCompteur
        });
        
        setResult({
          ...results,
          recommandation: recommendation
        });

        localStorage.setItem('solarResults', JSON.stringify(results));
      } catch (error) {
        console.error('Erreur de calcul:', error);
        setError(error instanceof Error ? error.message : 'Erreur de calcul');
        setResult(null);
      } finally {
        setCalculating(false);
      }
    };

    const timeoutId = setTimeout(calculate, 500);
    return () => clearTimeout(timeoutId);
  }, [params, setResult]);

  const handleReset = () => {
    // Reset client info and address
    resetClientInfo();
    
    // Reset solar data
    resetData();
    
    // Reset result
    setResult(null);
    
    // Reset calculation state
    setCalculating(false);
    setError(null);
    
    // Clear battery selection
    localStorage.removeItem('batterySelection');
    
    // Clear financial data
    localStorage.removeItem('financialMode');
    localStorage.removeItem('primeAutoconsommation');
    localStorage.removeItem('remiseCommerciale');
    localStorage.removeItem('subscriptionDuration');
    localStorage.removeItem('connectionType');
    
    // Clear promo codes
    localStorage.removeItem('applied_promo_codes');
    localStorage.removeItem('promo_discount');
    localStorage.removeItem('promo_free_months');
    localStorage.removeItem('promo_free_deposit');
    localStorage.removeItem('promo_free_battery_setup');
    localStorage.removeItem('promo_free_smart_battery_setup');
    
    // Clear other data
    localStorage.removeItem('revenuFiscal');
    localStorage.removeItem('selectedPower');
    localStorage.removeItem('inverterType');
    localStorage.removeItem('bifacial');
    localStorage.removeItem('mountingSystem');
    localStorage.removeItem('satellite_image_url');
    localStorage.removeItem('projection20ans_png');
    localStorage.removeItem('financial_projection');
    localStorage.removeItem('monthly_payment');
    localStorage.removeItem('subscription_deposit');
    localStorage.removeItem('quote_pdf_url');
    localStorage.removeItem('commercial_id');
    localStorage.removeItem('enedis_consumption_data');
    localStorage.removeItem('enedis_usage_point_id');
    localStorage.removeItem('enedis_access_token');
    localStorage.removeItem('enedis_refresh_token');
    localStorage.removeItem('enedis_token_expires');
    localStorage.removeItem('enedis_raw_response');
    
    console.log('All data has been reset');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!Number.isNaN(numValue)) {
      setParams(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    updateClientInfo({ [name]: value });
  };

  const handleAddressChange = (field: keyof typeof params.adresse, value: any) => {
    updateAddress({ [field]: value });
    setParams(prev => ({
      ...prev,
      adresse: {
        ...prev.adresse,
        [field]: value
      }
    }));
  };

  const handleCoordinatesChange = (newCoordinates: { lat: number; lon: number }) => {
    updateAddress({ coordinates: newCoordinates });
    setParams(prev => ({
      ...prev,
      adresse: {
        ...prev.adresse,
        coordinates: newCoordinates
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Estimez votre production d'énergie solaire
        </h2>
        <p className="text-gray-600">
          Calculez le potentiel de production d'énergie solaire de votre installation en fonction de vos paramètres spécifiques.
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Informations personnelles
            </h3>
            <div className="relative group">
              <button
                type="button"
                onClick={handleReset}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Réinitialiser
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Civilité
              </label>
              <select
                name="civilite"
                value={clientInfo.civilite}
                onChange={handlePersonalInfoChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="M">Monsieur</option>
                <option value="Mme">Madame</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                name="nom"
                value={clientInfo.nom}
                onChange={handlePersonalInfoChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                name="prenom"
                value={clientInfo.prenom}
                onChange={handlePersonalInfoChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={clientInfo.telephone}
                onChange={handlePersonalInfoChange}
                placeholder="06 12 34 56 78"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={clientInfo.email}
                onChange={handlePersonalInfoChange}
                placeholder="exemple@email.com"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <AddressForm
          address={params.adresse}
          onChange={handleAddressChange}
        />

        {params.adresse.coordinates && (
          <GoogleMapsView 
            coordinates={params.adresse.coordinates}
            onCoordinatesChange={handleCoordinatesChange}
          />
        )}

        {params.adresse.codePostal && (
          <SunshineDisplay codePostal={params.adresse.codePostal} />
        )}

        <SizingSection
          typeCompteur={params.typeCompteur}
          consommationAnnuelle={params.consommationAnnuelle}
          onTypeCompteurChange={handleSelectChange}
          onConsommationChange={handleChange}
        />

        {result?.recommandation && (
          <RecommendationDisplay
            recommendation={result.recommandation}
            consommationAnnuelle={params.consommationAnnuelle}
            departement={params.adresse.codePostal.substring(0, 2)}
          />
        )}

        <InstallationSection
          params={params}
          onChange={handleChange}
          onSelectChange={handleSelectChange}
          onParamsChange={(updates) => setParams(prev => ({ ...prev, ...updates }))}
        />

        {calculating ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Calcul en cours...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            {error}
          </div>
        ) : result && (
          <ResultsSection result={result} />
        )}

        <NavigationButtons
          onReset={handleReset}
          canProceed={!!result && !calculating && !error}
          result={result}
        />
      </form>
    </div>
  );
}