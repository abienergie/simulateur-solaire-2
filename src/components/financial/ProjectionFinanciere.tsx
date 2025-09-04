import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Mail, Calculator, ArrowRight, Sun, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useClient } from '../../contexts/client';
import ResultsSection from '../ResultsSection';
import FinancingOptions from '../financial/FinancingOptions';
import FinancialParameters from '../financial/FinancialParameters';
import ProjectionTable from '../financial/ProjectionTable';
import ProjectionSummary from '../financial/ProjectionSummary';
import InstalledTechnologies from '../financial/InstalledTechnologies';
import PricingDrawer from '../financial/PricingDrawer';
import { useFinancialProjection } from '../../hooks/useFinancialProjection';
import { scrollToTop } from '../../utils/scroll';
import { getSubscriptionPrice, getPriceFromPower, calculateSubsidy, calculateEnphaseCost } from '../../utils/calculations/priceCalculator';
import { useFinancialSettings } from '../../contexts/FinancialSettingsContext';

interface RecommendedKit {
  power: number;
  duration: number;
  monthlyPayment: number;
  annualRatio: number;
}

function ProjectionFinanciere() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCalculating, setIsCalculating] = useState(false);
  const [showProjection, setShowProjection] = useState(false);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [solarResults, setSolarResults] = useState<any>(null);
  const [inverterType, setInverterType] = useState<'central' | 'solenso' | 'enphase'>(() => {
    return localStorage.getItem('inverterType') as 'central' | 'solenso' | 'enphase' || 'central';
  });
  const [bifacial, setBifacial] = useState(() => {
    return localStorage.getItem('bifacial') === 'true';
  });
  const [mountingSystem, setMountingSystem] = useState<'surimposition' | 'bac-lestes' | 'integration'>(() => {
    return localStorage.getItem('mountingSystem') as 'surimposition' | 'bac-lestes' | 'integration' || 'surimposition';
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { settings } = useFinancialSettings();
  const [powerOptions, setPowerOptions] = useState<Array<{value: number, label: string}>>([]);
  const [basePrice, setBasePrice] = useState(0);
  
  const { 
    projection,
    parameters,
    updateParameters,
    calculateProjection
  } = useFinancialProjection();
  
  console.log('[ProjectionFinanciere] render parameters.financingMode =', parameters.financingMode);

  useEffect(() => {
    if (parameters.puissanceCrete && settings) {
      console.log('Calculating subsidy with:', {
        power: parameters.puissanceCrete,
        settings: settings
      });
      const primeAmount = calculateSubsidy(parameters.puissanceCrete, settings);
      console.log('Calculated subsidy amount:', primeAmount);
      if (primeAmount !== parameters.primeAutoconsommation) {
        updateParameters({ primeAutoconsommation: primeAmount });
      }
    }
  }, [parameters.puissanceCrete, settings]);

  // Calculate base price when power changes
  useEffect(() => {
    if (parameters.puissanceCrete) {
      const price = getPriceFromPower(parameters.puissanceCrete);
      setBasePrice(price);
    }
  }, [parameters.puissanceCrete]);

  // Save technology selections to localStorage for persistence
  useEffect(() => {
    localStorage.setItem('inverterType', inverterType);
    localStorage.setItem('bifacial', bifacial.toString());
    localStorage.setItem('mountingSystem', mountingSystem);
  }, [inverterType, bifacial, mountingSystem]);

  // Listen for custom price updates
  useEffect(() => {
    const handleCustomPricesUpdate = () => {
      if (solarResults?.typeCompteur) {
        updatePowerOptions(solarResults.typeCompteur);
      }
      // Recalculate base price when custom prices are updated
      if (parameters.puissanceCrete) {
        const price = getPriceFromPower(parameters.puissanceCrete);
        setBasePrice(price);
      }
    };

    window.addEventListener('customPricesUpdated', handleCustomPricesUpdate);
    return () => {
      window.removeEventListener('customPricesUpdated', handleCustomPricesUpdate);
    };
  }, [solarResults, parameters.puissanceCrete]);

  const updatePowerOptions = (typeCompteur: string) => {
    const isMonophase = typeCompteur === 'monophase';
    const maxStandardPower = isMonophase ? 6.0 : 9.0;
    
    // Start with standard powers
    const options = [];
    for (let power = 3.0; power <= maxStandardPower; power += 0.5) {
      options.push({
        value: power,
        label: `${power.toFixed(1)} kWc`
      });
    }
    
    // Add pro powers from settings
    const customPrices = settings.installationPrices.filter(p => p.power > 9);
    customPrices.forEach(price => {
      options.push({
        value: price.power,
        label: `${price.power.toFixed(1)} kWc (Pro)`
      });
    });
    
    setPowerOptions(options);
    console.log('Updated power options:', options);
  };

  const handleKitSelect = (kit: RecommendedKit) => {
    updateParameters({
      puissanceCrete: kit.power,
      dureeAbonnement: kit.duration
    });
  };

  const enphasePrice = inverterType === 'enphase' ? calculateEnphaseCost(parameters.puissanceCrete) : 0;
  const batteryPrice = parameters.batterySelection?.type === 'physical' && parameters.batterySelection.model?.oneTimePrice || 0;
  const smartChargerPrice = parameters.batterySelection?.includeSmartCharger ? 1500 : 0;
  const myLightPrice = parameters.batterySelection?.type === 'virtual' ? 
    (parameters.batterySelection.virtualCapacity === 100 ? 180 :
     parameters.batterySelection.virtualCapacity === 300 ? 288 :
     parameters.batterySelection.virtualCapacity === 600 ? 360 : 420) : 0;
  const subscriptionPrice = getSubscriptionPrice(parameters.puissanceCrete, parameters.dureeAbonnement || 20);
  
  // Calculer le nombre de panneaux (approximatif)
  const numberOfPanels = Math.ceil(parameters.puissanceCrete * 2); // ~500W par panneau
  
  // Calculer le surcoût du système de fixation
  const mountingSystemCost = mountingSystem === 'bac-lestes' 
    ? 60 * numberOfPanels 
    : mountingSystem === 'integration' 
      ? 100 * numberOfPanels 
      : 0;

  useEffect(() => {
    console.log('[ProjectionFinanciere] useEffect for loading data');
    const savedResults = localStorage.getItem('solarResults');
    if (!savedResults) {
      navigate('/');
      return;
    }

    try {
      const results = JSON.parse(savedResults);
      if (!results.typeCompteur) {
        console.error('Type de compteur manquant dans les résultats');
        navigate('/');
        return;
      }
      setSolarResults(results);
      updatePowerOptions(results.typeCompteur);
      
      const { productionAnnuelle, puissanceCrete } = results;

      const suggestedPower = location.state?.power || localStorage.getItem('selectedPower');
      const suggestedDuration = location.state?.duration || localStorage.getItem('subscriptionDuration');
      
      const actualPower = suggestedPower ? parseFloat(suggestedPower) : puissanceCrete;

      if (!productionAnnuelle || !actualPower) {
        navigate('/');
        return;
      }

      console.log('[ProjectionFinanciere] Before updateParameters call, current financingMode =', parameters.financingMode);
      updateParameters({
        productionAnnuelle,
        puissanceCrete: actualPower,
        // Ne pas réécrire financingMode ici pour préserver la sélection de l'utilisateur
        dureeAbonnement: suggestedDuration ? parseInt(suggestedDuration, 10) : 20
      });
      console.log('[ProjectionFinanciere] After updateParameters call, financingMode =', parameters.financingMode);

      localStorage.removeItem('selectedPower');
      localStorage.removeItem('subscriptionDuration');
    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error);
      navigate('/');
    }
  }, [navigate, updateParameters, location.state, settings]);

  const handleCalculate = async () => {
    if (!parameters.productionAnnuelle || !parameters.puissanceCrete) return;
    
    setIsCalculating(true);
    
    if (parameters.dureeAbonnement) {
      localStorage.setItem('subscriptionDuration', parameters.dureeAbonnement.toString());
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    calculateProjection(parameters.productionAnnuelle, parameters.puissanceCrete);
    setShowProjection(true);
    setIsCalculating(false);
  };

  const handlePowerChange = (newPower: number) => {
    if (!solarResults?.typeCompteur) {
      console.error('Type de compteur non défini');
      return;
    }

    const isMonophase = solarResults.typeCompteur === 'monophase';
    const maxStandardPower = isMonophase ? 6.0 : 9.0;
    
    // Allow any power, but warn if it exceeds standard limits for non-pro kits
    if (newPower <= 9 && newPower > maxStandardPower) {
      console.warn(`Puissance ${newPower} kWc supérieure à la limite ${maxStandardPower} kWc en ${solarResults.typeCompteur}`);
    }

    const updatedResults = {
      ...solarResults,
      puissanceCrete: newPower,
      productionAnnuelle: Math.round(newPower * (solarResults.productionAnnuelle / solarResults.puissanceCrete)),
      surfaceTotale: Math.round(newPower * 2.3 * 100) / 100
    };
    setSolarResults(updatedResults);
    localStorage.setItem('solarResults', JSON.stringify(updatedResults));
    localStorage.setItem('selectedPower', newPower.toString());

    updateParameters({
      puissanceCrete: newPower,
      productionAnnuelle: updatedResults.productionAnnuelle
    });
  };

  const handleEligibilityClick = () => {
    scrollToTop();
    navigate('/eligibilite');
  };

  const isCalculationDisabled = parameters.batterySelection?.type === 'virtual' && !parameters.batterySelection?.virtualCapacity;

  if (!solarResults?.typeCompteur) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au dimensionnement
        </Link>
      </div>

      <div className="space-y-8">
        <ResultsSection 
          result={solarResults} 
          onModifyPower={() => setShowPowerModal(true)} 
        />

        {showPowerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ajuster la puissance
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puissance (kWc)
                  </label>
                  <select
                    value={solarResults.puissanceCrete}
                    onChange={(e) => handlePowerChange(parseFloat(e.target.value))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {powerOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {solarResults.typeCompteur === 'monophase' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Limité à 6 kWc en monophasé
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPowerModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setShowPowerModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="space-y-8 p-8">
            <FinancingOptions
              selectedMode={parameters.financingMode}
              onModeChange={(mode) => {
                console.log('[ProjectionFinanciere] FinancingOptions.onModeChange called with:', mode);
                updateParameters({ financingMode: mode });
                // Réinitialiser le système de fixation en mode abonnement
                if (mode === 'subscription' && mountingSystem !== 'surimposition') {
                  setMountingSystem('surimposition');
                }
              }}
              puissanceCrete={parameters.puissanceCrete}
              dureeAbonnement={parameters.dureeAbonnement || 20}
              onDureeChange={(duree) => updateParameters({ dureeAbonnement: duree })}
              onKitSelect={handleKitSelect}
              batterySelection={parameters.batterySelection}
            />

            <InstalledTechnologies
              financingMode={parameters.financingMode}
              inverterType={inverterType}
              onInverterChange={(type) => {
                setInverterType(type);
                localStorage.setItem('inverterType', type);
              }}
              bifacial={bifacial}
              onBifacialChange={(enabled) => {
                setBifacial(enabled);
                localStorage.setItem('bifacial', enabled.toString());
              }}
              installedPower={parameters.puissanceCrete}
              mountingSystem={mountingSystem}
              onMountingSystemChange={(system) => {
                // Vérifier si on est en mode abonnement
                if (parameters.financingMode === 'subscription' && system !== 'surimposition') {
                  return; // Ne pas changer si on est en abonnement
                }
                setMountingSystem(system);
                localStorage.setItem('mountingSystem', system);
              }}
            />
            
            <FinancialParameters
              parameters={parameters}
              onParameterChange={updateParameters}
              puissanceCrete={parameters.puissanceCrete}
            />

            <div className="flex justify-center">
              <button
                onClick={handleCalculate}
                disabled={isCalculating || isCalculationDisabled}
                className="relative px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-2">
                  {isCalculating ? (
                    <>
                      <div className="relative w-5 h-5">
                        <Sun className="absolute inset-0 w-5 h-5 text-yellow-300 animate-spin" />
                      </div>
                      <span>Calcul en cours...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      <span>Calculer la projection financière</span>
                    </>
                  )}
                </div>
                {isCalculationDisabled && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded invisible group-hover:visible whitespace-nowrap">
                    Veuillez sélectionner une capacité de stockage virtuel
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {showProjection && projection && !isCalculating && (
          <>
            <ProjectionTable projection={projection} />
            <ProjectionSummary projection={projection} />

            <div className="mt-8 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Pour toute demande d'étude d'éligibilité au dossier, nos conseillers sont à votre disposition :
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <a href="tel:0183835150" className="text-blue-600 hover:text-blue-800 font-medium">
                        01 83 83 51 50
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <a href="mailto:contact@abie.fr" className="text-blue-600 hover:text-blue-800 font-medium">
                        contact@abie.fr
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleEligibilityClick}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tester mon éligibilité
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className={`fixed top-1/2 right-0 transform -translate-y-1/2 bg-green-500 text-white p-2 rounded-l-lg shadow-lg transition-transform hover:bg-green-600 ${
          isDrawerOpen ? 'translate-x-96' : 'translate-x-0'
        }`}
      >
        {isDrawerOpen ? (
          <ChevronRight className="h-6 w-6" />
        ) : (
          <ChevronLeft className="h-6 w-6" />
        )}
      </button>

      <PricingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        financingMode={parameters.financingMode}
        basePrice={basePrice}
        enphasePrice={enphasePrice}
        batteryPrice={batteryPrice}
        smartChargerPrice={smartChargerPrice}
        myLightPrice={myLightPrice}
        primeAutoconsommation={parameters.primeAutoconsommation}
        subscriptionPrice={subscriptionPrice}
        duration={parameters.dureeAbonnement || 20}
        installedPower={parameters.puissanceCrete}
        connectionType={parameters.connectionType}
        batterySelection={parameters.batterySelection}
        mountingSystem={mountingSystem}
        mountingSystemCost={mountingSystemCost}
        numberOfPanels={numberOfPanels}
      />
    </div>
  );
}

export default ProjectionFinanciere;