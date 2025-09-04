import React, { useState, useEffect, useRef } from 'react';
import { Battery, BatteryCharging, CloudLightning, Car, CloudSun, Info, Play } from 'lucide-react';
import { PhysicalBattery, VirtualBattery, BatterySelection } from '../types/battery';
import { PHYSICAL_BATTERIES, VIRTUAL_BATTERIES } from '../utils/constants/batteryOptions';
import { formatCurrency } from '../utils/formatters';
import { useBatteries } from '../hooks/useBatteries';
import { useFinancialSettings } from '../contexts/FinancialSettingsContext';
import { getSubscriptionPrice } from '../utils/calculations/priceCalculator';
import SmartBatteryModal from './SmartBatteryModal';

interface BatterySelectorProps {
  value: BatterySelection;
  onChange: (selection: BatterySelection) => void;
  subscriptionDuration: number;
  installedPower: number;
  initialAutoconsommation?: number;
  connectionType?: string;
  batteryFormula: 'abonnement' | 'comptant';
}

export default function BatterySelector({
  value,
  onChange,
  subscriptionDuration,
  installedPower,
  initialAutoconsommation = 75,
  connectionType = 'surplus',
  batteryFormula
}: BatterySelectorProps) {
  const { batteries: purchaseBatteries, loading: batteriesLoading } = useBatteries();
  const { settings } = useFinancialSettings();
  const [showOptions, setShowOptions] = useState(false);
  const [hasElectricVehicle, setHasElectricVehicle] = useState(false);
  const [includeSmartCharger, setIncludeSmartCharger] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showSmartBatteryModal, setShowSmartBatteryModal] = useState(false);
  const [batteryOptions, setBatteryOptions] = useState({
    physicalBattery: true,
    myBattery: true,
    smartBattery: true
  });
  const [revenuFiscal, setRevenuFiscal] = useState(() => {
    return localStorage.getItem('revenuFiscal') || '';
  });
  const prevConn = useRef<string>();
  const prevFormula = useRef<string>();

  const defaultAutoconsommation = settings?.defaultAutoconsumption ?? initialAutoconsommation;

  const filteredPhysicalBatteries = batteryFormula === 'abonnement'
    ? PHYSICAL_BATTERIES.filter(battery => battery.duration <= subscriptionDuration)
    : purchaseBatteries;

  // Load battery selection from localStorage - runs only once
  useEffect(() => {
    const savedBatterySelection = localStorage.getItem('batterySelection');
    if (!savedBatterySelection) return;
    try {
      const sel = JSON.parse(savedBatterySelection);
      onChange(sel);
      
      // sync hasElectricVehicle/includeSmartCharger if needed
      if (sel.type === 'virtual') {
        setShowOptions(true);
        if (sel.includeSmartCharger) {
          setHasElectricVehicle(true);
          setIncludeSmartCharger(true);
        }
      } else if (sel.type === 'physical' || sel.type === 'mybattery') {
        setShowOptions(true);
      }
    } catch (e) {
      console.error('Error parsing saved battery selection:', e);
    }
  }, []); // run only once

  useEffect(() => {
    const saved = localStorage.getItem('battery_options');
    if (saved) {
      setBatteryOptions(JSON.parse(saved));
    }

    const handleBatteryOptionsUpdate = (event: CustomEvent) => {
      setBatteryOptions(event.detail);
    };

    window.addEventListener('batteryOptionsUpdated', handleBatteryOptionsUpdate as EventListener);
    return () => {
      window.removeEventListener('batteryOptionsUpdated', handleBatteryOptionsUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (connectionType === 'total_sale' && prevConn.current !== 'total_sale') {
      setShowOptions(false);
      onChange({
        type: null,
        resetAutoconsommation: defaultAutoconsommation
      });
      setIncludeSmartCharger(false);
      setHasElectricVehicle(false);
    }
    prevConn.current = connectionType;
  }, [connectionType, defaultAutoconsommation]); // no onChange here

  // NOUVEL EFFET pour reset à chaque passage en mode comptant
  useEffect(() => {
    if (batteryFormula === 'comptant' && prevFormula.current === 'abonnement') {
      setShowOptions(false);
      onChange({ type: null, resetAutoconsommation: defaultAutoconsommation });
      localStorage.removeItem('batterySelection');
      setIncludeSmartCharger(false);
      setHasElectricVehicle(false);
    }
    prevFormula.current = batteryFormula;
  }, [batteryFormula, defaultAutoconsommation, onChange]);

  const handleTypeChange = (type: 'physical' | 'virtual' | 'mybattery' | null) => {
    let newAutoconsommation = defaultAutoconsommation;
    
    if (type === 'virtual') {
      newAutoconsommation = 100;
    }
    
    const selection = {
      type,
      includeSmartCharger: type === 'virtual' ? includeSmartCharger : false,
      resetAutoconsommation: newAutoconsommation
    };
    
    onChange(selection);
    
    // Save to localStorage
    localStorage.setItem('batterySelection', JSON.stringify({
      type,
      includeSmartCharger: type === 'virtual' ? includeSmartCharger : false,
      resetAutoconsommation: newAutoconsommation
    }));
  };

  const handlePhysicalBatterySelect = (battery: PhysicalBattery) => {
    const newAutoconsommation = Math.min(100, defaultAutoconsommation + battery.autoconsumptionIncrease);
    const selection = {
      type: 'physical',
      model: battery,
      includeSmartCharger: false,
      resetAutoconsommation: newAutoconsommation
    };
    
    onChange(selection);
    localStorage.setItem('batterySelection', JSON.stringify(selection));
  };

  const handleVirtualCapacitySelect = (capacity: number) => {
    const selection = {
      type: 'virtual',
      virtualCapacity: capacity,
      includeSmartCharger: hasElectricVehicle ? includeSmartCharger : false,
      resetAutoconsommation: 100
    };
    
    onChange(selection);
    localStorage.setItem('batterySelection', JSON.stringify(selection));
  };

  const handleSmartChargerToggle = (checked: boolean) => {
    setIncludeSmartCharger(checked);
    if (value.type === 'virtual') {
      const updatedSelection = {
        ...value,
        includeSmartCharger: checked
      };
      onChange(updatedSelection);
      localStorage.setItem('batterySelection', JSON.stringify(updatedSelection));
    }
  };

  const handleElectricVehicleToggle = (checked: boolean) => {
    setHasElectricVehicle(checked);
    if (!checked) {
      setIncludeSmartCharger(false);
      if (value.type === 'virtual') {
        const updatedSelection = {
          ...value,
          includeSmartCharger: false
        };
        onChange(updatedSelection);
        localStorage.setItem('batterySelection', JSON.stringify(updatedSelection));
      }
    }
  };

  const handleRevenuFiscalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setRevenuFiscal(value);
    
    if (value) {
      localStorage.setItem('revenuFiscal', value);
    } else {
      localStorage.removeItem('revenuFiscal');
    }
  };

  // Vérifier l'éligibilité financière pour la batterie physique
  const checkBatteryEligibility = (battery: PhysicalBattery) => {
    if (batteryFormula !== 'abonnement' || !revenuFiscal) return true;
    
    const revenuAnnuel = parseInt(revenuFiscal, 10);
    if (revenuAnnuel <= 0) return true;
    
    // Calculer le coût mensuel total (abonnement solaire + batterie)
    const baseSubscriptionPrice = getSubscriptionPrice(installedPower, subscriptionDuration);
    const totalMonthlyPrice = baseSubscriptionPrice + battery.monthlyPrice;
    const annualCost = totalMonthlyPrice * 12;
    
    // Vérifier que le coût annuel ne dépasse pas 7% du revenu fiscal
    return (annualCost / revenuAnnuel * 100) <= 7;
  };

  const monthlyMyBatteryCost = installedPower * 1.055;

  if (connectionType === 'total_sale') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          Les solutions de stockage ne sont pas disponibles en revente totale.
        </p>
      </div>
    );
  }

  const showPhysicalBatteryOption = batteryFormula === 'comptant'
    ? purchaseBatteries?.length > 0
    : filteredPhysicalBatteries.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium text-gray-900">Solution de stockage</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={showOptions}
              onChange={(e) => {
                setShowOptions(e.target.checked);
                if (!e.target.checked) {
                  onChange({
                    type: null,
                    resetAutoconsommation: defaultAutoconsommation
                  });
                  localStorage.removeItem('batterySelection');
                  setIncludeSmartCharger(false);
                  setHasElectricVehicle(false);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-700">Je souhaite une solution de stockage</span>
        </label>
      </div>

      {showOptions && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {batteryOptions.physicalBattery && showPhysicalBatteryOption && (
              <button
                onClick={() => handleTypeChange('physical')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  value.type === 'physical'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <BatteryCharging className="h-6 w-6 text-gray-400" />
                  <span className="font-medium">Batterie physique</span>
                  <span className="text-xs text-gray-500">Stockage sur site</span>
                </div>
              </button>
            )}

            {batteryOptions.myBattery && (
              <button
                onClick={() => handleTypeChange('mybattery')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  value.type === 'mybattery'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <CloudSun className="h-6 w-6 text-gray-400" />
                  <span className="font-medium">MyBattery</span>
                  <span className="text-xs text-gray-500">Stockage virtuel</span>
                </div>
              </button>
            )}

            {batteryOptions.smartBattery && (
              <button
                onClick={() => handleTypeChange('virtual')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  value.type === 'virtual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <CloudLightning className="h-6 w-6 text-gray-400" />
                  <span className="font-medium">Smart Battery</span>
                  <span className="text-xs text-gray-500">Stockage virtuel + pilotage</span>
                </div>
              </button>
            )}
          </div>

          {value.type === 'physical' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Choisissez votre batterie</h4>
              
              {/* Champ de revenu fiscal pour batterie physique en mode abonnement */}
              {batteryFormula === 'abonnement' && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h5 className="font-medium text-blue-800 mb-2">Centrale solaire + Batterie</h5>
                  <p className="text-sm text-blue-700 mb-3">
                    Pour un abonnement avec batterie physique, l'annualité totale ne doit pas dépasser 7% de votre revenu fiscal de référence.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-blue-700">
                      Revenu fiscal de référence
                    </label>
                    <input
                      type="text"
                      value={revenuFiscal}
                      onChange={handleRevenuFiscalChange}
                      placeholder="Montant en euros"
                      className="w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              {batteriesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Chargement des batteries...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batteryFormula === 'comptant' ? (
                    purchaseBatteries.map((battery) => (
                      <div
                        key={battery.id}
                        onClick={() => handlePhysicalBatterySelect(battery)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          value.model?.id === battery.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">{battery.model}</h5>
                            <p className="text-sm text-gray-600">{battery.capacity} kWh</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-blue-600">
                              {formatCurrency(battery.oneTimePrice)} TTC
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-green-600">
                          +{battery.autoconsumptionIncrease}% d'autoconsommation
                        </p>
                      </div>
                    ))
                  ) : (
                    filteredPhysicalBatteries.map((battery) => {
                      const isEligible = checkBatteryEligibility(battery);
                      
                      return (
                        <div
                          key={battery.id}
                          onClick={() => isEligible && handlePhysicalBatterySelect(battery)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            !isEligible 
                              ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                              : value.model?.id === battery.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium">{battery.model}</h5>
                              <p className="text-sm text-gray-600">{battery.capacity} kWh</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-blue-600">{formatCurrency(battery.monthlyPrice)}/mois</p>
                              <p className="text-sm text-gray-600">{battery.duration} ans</p>
                            </div>
                          </div>
                          <p className="text-sm text-green-600">
                            +{battery.autoconsumptionIncrease}% d'autoconsommation
                          </p>
                          
                          {!isEligible && revenuFiscal && (
                            <div className="mt-2 bg-amber-50 p-2 rounded text-xs text-amber-700">
                              Revenu fiscal insuffisant pour cette batterie
                            </div>
                          )}
                          
                          {batteryFormula === 'abonnement' && (
                            <div className="mt-2 text-xs text-gray-600">
                              Coût total mensuel: {formatCurrency(getSubscriptionPrice(installedPower, subscriptionDuration) + battery.monthlyPrice)}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {value.type === 'virtual' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    Smart Battery de MyLight
                    <button
                      onClick={() => setShowSmartBatteryModal(true)}
                      className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                      title="Voir la démonstration"
                    >
                      <Play className="h-4 w-4 text-blue-600" />
                    </button>
                  </h4>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  Solution innovante de pilotage intelligent de vos équipements pour maximiser l'autoconsommation sans batterie physique. Récupérez la nuit, en hiver, le surplus solaire stocké avec un rendement optimal : <strong>1kWh stocké = 1kWh restitué</strong>.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-blue-800">✓ Pilotage automatique du ballon d'eau chaude</p>
                  <p className="text-sm text-blue-800">✓ Gestion intelligente de la pompe à chaleur</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-blue-800">✓ Optimisation de la recharge du véhicule électrique</p>
                    <input
                      type="checkbox"
                      id="hasElectricVehicle"
                      checked={hasElectricVehicle}
                      onChange={(e) => handleElectricVehicleToggle(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-sm text-blue-800">✓ Monitoring en temps réel de la production/consommation</p>
                  <div className="flex items-center">
                    <p className="text-sm text-blue-800">✓ Souscription à mylight150 comme fournisseur d'énergie</p>
                    <div className="relative inline-block ml-2 group">
                      <Info className="h-4 w-4 text-blue-400 cursor-help" />
                      <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-72 -right-2 bottom-6">
                        <div className="absolute -bottom-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                        Les tarifs MyLight sont indexés sur les tarifs réglementés EDF, aussi bien pour le prix du kWh que pour l'abonnement.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-amber-800">
                  Frais d'installation et mise en service : {formatCurrency(2000)} TTC
                </div>
              </div>

              {hasElectricVehicle && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-gray-900">MySmartCharger – La borne de recharge intelligente</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="includeSmartCharger"
                        checked={includeSmartCharger}
                        onChange={(e) => handleSmartChargerToggle(e.target.checked)}
                        className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <label htmlFor="includeSmartCharger" className="text-sm text-green-700">
                        Ajouter au chiffrage ({formatCurrency(1500)} TTC)
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-green-800">
                      Gagnez de l'argent en rechargeant votre véhicule le week-end
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="bg-white px-3 py-1 rounded-full text-green-700">
                        0,05 €/kWh (recharge via le réseau)
                      </div>
                      <div className="bg-white px-3 py-1 rounded-full text-green-700">
                        0,10 €/kWh (recharge solaire via MySmartBattery)
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <a 
                      href="https://www.mylight150.com/solutions/borne-de-recharge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      👉 Découvrir l'offre
                    </a>
                  </div>
                </div>
              )}
              
              <h4 className="font-medium text-gray-700">Choisissez votre capacité de pilotage</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {VIRTUAL_BATTERIES.map((battery) => (
                  <div
                    key={battery.capacity}
                    onClick={() => handleVirtualCapacitySelect(battery.capacity)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      value.virtualCapacity === battery.capacity
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <h5 className="font-medium">{battery.capacity} kW</h5>
                      <p className="text-blue-600 font-medium mt-1">
                        {formatCurrency(battery.monthlyPrice)}/mois
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-green-600 font-medium">
                Jusqu'à 100% d'autoconsommation grâce au pilotage intelligent
              </p>
            </div>
          )}

          {value.type === 'mybattery' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">MyBattery - La solution de stockage la plus simple du marché</h4>
                <div className="space-y-3">
                  <p className="text-sm text-blue-800">
                    MyBattery vous permet d'exploiter pleinement votre production solaire : stockez chaque kWh non consommé et récupérez-le à tout moment à prix coûtant après s'être acquitté des frais d'acheminement.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800">✓ Capacité illimitée : stockez toute l'énergie que vous produisez, sans limite</p>
                    <div className="flex items-center">
                      <p className="text-sm text-blue-800">✓ Zéro installation, zéro matériel : une souscription à mylight150 comme fournisseur d'énergie suffit</p>
                      <div className="relative inline-block ml-2 group">
                        <Info className="h-4 w-4 text-blue-400 cursor-help" />
                        <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-72 -right-2 bottom-6">
                          <div className="absolute -bottom-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                          Les tarifs MyLight sont indexés sur les tarifs réglementés EDF, aussi bien pour le prix du kWh que pour l'abonnement.
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-blue-800">✓ Frais de mise en service : 179€ TTC</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      Coût mensuel : <strong>{formatCurrency(monthlyMyBatteryCost)}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      (<strong>1€ HT</strong>/kWc installé par mois soit {formatCurrency(1.055)} TTC/kWc)
                    </p>
                  </div>
                  <p className="text-sm text-blue-800">
                    Le surplus récupéré = prix du kWh - {formatCurrency(0.0996)} de taxes
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <SmartBatteryModal 
        isOpen={showSmartBatteryModal}
        onClose={() => setShowSmartBatteryModal(false)}
      />
    </div>
  );
}