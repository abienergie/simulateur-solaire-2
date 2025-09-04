import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, ArrowLeft, Database, Sliders, Zap, Package, ToggleLeft, Coins, Calendar, Percent, RefreshCw, Key, Battery, Save, Ticket, Plus, X, ExternalLink, Info } from 'lucide-react';
import { useFinancialSettings } from '../contexts/FinancialSettingsContext';
import { usePromoCode } from '../hooks/usePromoCode';
import { formatCurrency } from '../utils/formatters';
import { SUBSCRIPTION_PROMO_CODES, LOCAL_PROMO_CODES } from '../utils/constants/promoCodeConstants';

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  active: boolean;
}

export default function Settings() {
  const { settings, updateSettings, addInstallationPrice, removeInstallationPrice } = useFinancialSettings();
  const { applyPromoCode } = usePromoCode();
  const [newPower, setNewPower] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [batteryOptions, setBatteryOptions] = useState({
    physicalBattery: true,
    myBattery: true,
    smartBattery: true
  });
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState({
    sellPrices: false,
    defaultValues: false,
    installationPrices: false,
    batteryOptions: false,
    subscriptionOptions: false,
    promoCodes: false,
    predefinedCodes: false,
    usefulLinks: false
  });
  const [localPromoCodes, setLocalPromoCodes] = useState<PromoCode[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [newPromoExpiration, setNewPromoExpiration] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Charger les options de batterie depuis le localStorage
  useEffect(() => {
    const savedOptions = localStorage.getItem('battery_options');
    if (savedOptions) {
      setBatteryOptions(JSON.parse(savedOptions));
    }
    
    const savedSubscriptionOption = localStorage.getItem('subscription_enabled');
    if (savedSubscriptionOption !== null) {
      setSubscriptionEnabled(savedSubscriptionOption === 'true');
    }

    // Charger les codes promo locaux
    const savedPromoCodes = localStorage.getItem('local_promo_codes');
    if (savedPromoCodes) {
      try {
        setLocalPromoCodes(JSON.parse(savedPromoCodes));
      } catch (e) {
        console.error('Erreur lors du chargement des codes promo:', e);
      }
    }
  }, []);

  const handleSaveBatteryOptions = () => {
    localStorage.setItem('battery_options', JSON.stringify(batteryOptions));
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('batteryOptionsUpdated', {
      detail: batteryOptions
    }));
    
    showSuccess('Options de batterie sauvegardées');
  };

  const handleToggleSubscription = () => {
    const newValue = !subscriptionEnabled;
    setSubscriptionEnabled(newValue);
    localStorage.setItem('subscription_enabled', newValue.toString());
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('subscriptionEnabledUpdated', {
      detail: newValue
    }));

    showSuccess('Options d\'abonnement mises à jour');
  };

  const handleAddPrice = () => {
    const power = parseFloat(newPower);
    const price = parseFloat(newPrice);
    
    if (isNaN(power) || isNaN(price) || power <= 0 || price <= 0) {
      alert('Veuillez entrer des valeurs numériques valides');
      return;
    }
    
    addInstallationPrice(power, price);
    setNewPower('');
    setNewPrice('');
    showSuccess('Prix d\'installation ajouté');
  };

  const handleRemovePrice = (power: number) => {
    if (power <= 9) {
      alert('Impossible de supprimer les prix standards');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le prix pour ${power} kWc ?`)) {
      removeInstallationPrice(power);
      showSuccess('Prix d\'installation supprimé');
    }
  };

  const handleUpdateSellPrices = (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const updates = {
      surplusSellPrices: {
        under9kw: parseFloat(formData.get('surplus_under9kw') as string),
        from9to36kw: parseFloat(formData.get('surplus_from9to36kw') as string),
        from36to100kw: parseFloat(formData.get('surplus_from36to100kw') as string)
      },
      totalSellPrices: {
        under9kw: parseFloat(formData.get('total_under9kw') as string),
        from9to36kw: parseFloat(formData.get('total_from9to36kw') as string),
        from36to100kw: parseFloat(formData.get('total_from36to100kw') as string)
      },
      sellPriceDate: formData.get('sell_price_date') as string
    };
    
    updateSettings(updates);
    showSuccess('Tarifs de revente mis à jour');
  };

  const handleUpdateDefaultValues = (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const updates = {
      baseKwhPrice: parseFloat(formData.get('base_kwh_price') as string),
      defaultAutoconsumption: parseFloat(formData.get('default_autoconsumption') as string),
      defaultEnergyRevaluation: parseFloat(formData.get('default_energy_revaluation') as string),
      defaultSellIndexation: parseFloat(formData.get('default_sell_indexation') as string),
      defaultPanelDegradation: parseFloat(formData.get('default_panel_degradation') as string)
    };
    
    updateSettings(updates);
    showSuccess('Valeurs par défaut mises à jour');
  };

  const handleAddPromoCode = () => {
    if (!newPromoCode || !newPromoDiscount) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const discount = parseFloat(newPromoDiscount);
    if (isNaN(discount) || discount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    const newCode: PromoCode = {
      id: crypto.randomUUID(),
      code: newPromoCode.toUpperCase(),
      discount: discount,
      active: true
    };

    const updatedCodes = [...localPromoCodes, newCode];
    setLocalPromoCodes(updatedCodes);
    localStorage.setItem('local_promo_codes', JSON.stringify(updatedCodes));
    
    setNewPromoCode('');
    setNewPromoDiscount('');
    showSuccess('Code promo ajouté');
  };

  const handleRemovePromoCode = (id: string) => {
    const updatedCodes = localPromoCodes.filter(code => code.id !== id);
    setLocalPromoCodes(updatedCodes);
    localStorage.setItem('local_promo_codes', JSON.stringify(updatedCodes));
    showSuccess('Code promo supprimé');
  };

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const applyAllChanges = () => {
    // Sauvegarder toutes les modifications
    handleSaveBatteryOptions();
    localStorage.setItem('subscription_enabled', subscriptionEnabled.toString());
    localStorage.setItem('local_promo_codes', JSON.stringify(localPromoCodes));
    
    // Afficher un message de succès
    showSuccess('Toutes les modifications ont été appliquées');
  };

  const renderPromoCodeSection = () => (
    <div className="space-y-6">
      {/* Section codes promo personnalisés */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Gestion des codes promo</h3>
          <button
            onClick={() => {
              if (newPromoCode.trim()) {
                applyPromoCode(newPromoCode);
                setNewPromoCode('');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un code
          </button>
        </div>

        {promoCodes.length > 0 ? (
          <div className="space-y-3">
            {promoCodes.map((code) => (
              <div key={code.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">{code.code}</p>
                    <p className="text-sm text-gray-600">
                      Remise: {formatCurrency(code.discount)}
                      {code.expiration_date && (
                        <span className="ml-2">
                          • Expire le {new Date(code.expiration_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    code.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {code.active ? 'Actif' : 'Inactif'}
                  </span>
                  <button
                    onClick={() => togglePromoCodeStatus(code.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <ToggleLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePromoCode(code.id)}
                    className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun code promo personnalisé</p>
            <p className="text-sm text-gray-500 mt-1">
              Cliquez sur "Ajouter un code" pour créer votre premier code promo
            </p>
          </div>
        )}
      </div>
      
      {/* Section codes promo prédéfinis */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Codes promo prédéfinis</h3>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Codes promo système</p>
              <p className="text-sm text-blue-700 mt-1">
                Ces codes sont intégrés dans l'application et ne peuvent pas être modifiés. 
                Ils sont automatiquement disponibles pour tous les utilisateurs.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Codes d'abonnement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBSCRIPTION_PROMO_CODES.map(code => (
                <div key={code.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {code.code}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      code.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {code.active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {code.discount > 0 && (
                      <p>• Remise : {formatCurrency(code.discount)}</p>
                    )}
                    {code.subscription_effect === 'free_months' && code.free_months && (
                      <p>• {code.free_months} mois offert{code.free_months > 1 ? 's' : ''}</p>
                    )}
                    {code.subscription_effect === 'free_deposit' && (
                      <p>• Caution offerte</p>
                    )}
                    {code.subscription_effect === 'free_battery_setup' && (
                      <p>• Frais d'activation MyBattery offerts</p>
                    )}
                    {code.subscription_effect === 'free_smart_battery_setup' && (
                      <p>• Frais SmartBattery offerts</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Type : {code.type === 'subscription_only' ? 'Abonnement uniquement' : 'Universel'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Codes comptant</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LOCAL_PROMO_CODES.map(code => (
                <div key={code.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {code.code}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      code.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {code.active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>• Remise : {formatCurrency(code.discount)}</p>
                    <p className="text-xs text-gray-500">
                      Type : Paiement comptant
                    </p>
                    {code.expiration_date && (
                      <p className="text-xs text-gray-500">
                        Expire le : {new Date(code.expiration_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au simulateur
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Paramètres du simulateur</h1>
        </div>
        <button
          onClick={applyAllChanges}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Save className="h-5 w-5" />
          Appliquer les modifications
        </button>
      </div>

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-md">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM6.7 9.29L9 11.6l4.3-4.3 1.4 1.42L9 14.4l-3.7-3.7 1.4-1.42z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Tarifs de revente EDF OA */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('sellPrices')}
          >
            <div className="flex items-center gap-3">
              <Coins className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">Tarifs de revente EDF OA</h2>
            </div>
            <div className="text-gray-500">
              {isExpanded.sellPrices ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          
          {isExpanded.sellPrices && (
            <form onSubmit={handleUpdateSellPrices} className="space-y-6 mt-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tarifs de revente du surplus
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ≤ 9 kWc
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="surplus_under9kw"
                        defaultValue={settings.surplusSellPrices.under9kw}
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€/kWh</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      9-36 kWc
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="surplus_from9to36kw"
                        defaultValue={settings.surplusSellPrices.from9to36kw}
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€/kWh</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      36-100 kWc
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="surplus_from36to100kw"
                        defaultValue={settings.surplusSellPrices.from36to100kw}
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€/kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tarifs de revente totale
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ≤ 9 kWc
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="total_under9kw"
                        defaultValue={settings.totalSellPrices.under9kw}
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€/kWh</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      9-36 kWc
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="total_from9to36kw"
                        defaultValue={settings.totalSellPrices.from9to36kw}
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€/kWh</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      36-100 kWc
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="total_from36to100kw"
                        defaultValue={settings.totalSellPrices.from36to100kw}
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€/kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de mise à jour des tarifs
                </label>
                <input
                  type="date"
                  name="sell_price_date"
                  defaultValue={settings.sellPriceDate}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Enregistrer les tarifs de revente
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Valeurs par défaut */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('defaultValues')}
          >
            <div className="flex items-center gap-3">
              <Sliders className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Valeurs par défaut</h2>
            </div>
            <div className="text-gray-500">
              {isExpanded.defaultValues ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          
          {isExpanded.defaultValues && (
            <form onSubmit={handleUpdateDefaultValues} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix du kWh
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="base_kwh_price"
                      defaultValue={settings.baseKwhPrice}
                      step="0.01"
                      min="0"
                      max="1"
                      className="w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">€/kWh</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux d'autoconsommation
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="default_autoconsumption"
                      defaultValue={settings.defaultAutoconsumption}
                      step="1"
                      min="0"
                      max="100"
                      className="w-full pr-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revalorisation énergie
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="default_energy_revaluation"
                      defaultValue={settings.defaultEnergyRevaluation}
                      step="0.1"
                      min="0"
                      max="10"
                      className="w-full pr-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indexation revente
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="default_sell_indexation"
                      defaultValue={settings.defaultSellIndexation}
                      step="0.1"
                      min="-5"
                      max="5"
                      className="w-full pr-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dégradation panneaux
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="default_panel_degradation"
                      defaultValue={settings.defaultPanelDegradation}
                      step="0.1"
                      min="-2"
                      max="0"
                      className="w-full pr-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enregistrer les valeurs par défaut
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Prix des installations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('installationPrices')}
          >
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-semibold text-gray-900">Prix des installations</h2>
            </div>
            <div className="text-gray-500">
              {isExpanded.installationPrices ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          
          {isExpanded.installationPrices && (
            <div className="mt-4 space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Prix standards
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puissance (kWc)
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix (€)
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {settings.installationPrices
                        .filter(price => price.power <= 9)
                        .map((price, index) => (
                          <tr key={price.power} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {price.power.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              <input
                                type="number"
                                value={price.price}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value);
                                  if (!isNaN(newPrice) && newPrice > 0) {
                                    addInstallationPrice(price.power, newPrice);
                                  }
                                }}
                                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
                                min="0"
                                step="10"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <button
                                onClick={() => {
                                  const newPrice = prompt(`Entrez le nouveau prix pour ${price.power.toFixed(1)} kWc:`, price.price.toString());
                                  if (newPrice) {
                                    const parsedPrice = parseFloat(newPrice);
                                    if (!isNaN(parsedPrice) && parsedPrice > 0) {
                                      addInstallationPrice(price.power, parsedPrice);
                                      showSuccess('Prix mis à jour');
                                    }
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Modifier
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {'Prix professionnels (> 9 kWc)'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puissance (kWc)
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix (€)
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {settings.installationPrices
                        .filter(price => price.power > 9)
                        .map((price, index) => (
                          <tr key={price.power} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {price.power.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              <input
                                type="number"
                                value={price.price}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value);
                                  if (!isNaN(newPrice) && newPrice > 0) {
                                    addInstallationPrice(price.power, newPrice);
                                  }
                                }}
                                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
                                min="0"
                                step="10"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <button
                                onClick={() => handleRemovePrice(price.power)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ajouter un prix professionnel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puissance (kWc)
                    </label>
                    <input
                      type="number"
                      value={newPower}
                      onChange={(e) => setNewPower(e.target.value)}
                      step="0.5"
                      min="9.5"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (€)
                    </label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      step="100"
                      min="0"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddPrice}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Codes promo */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('promoCodes')}
          >
            <div className="flex items-center gap-3">
              <Ticket className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900">Codes promo</h2>
            </div>
            <div className="text-gray-500">
              {isExpanded.promoCodes ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          
          {isExpanded.promoCodes && renderPromoCodeSection()}
        </div>

        {/* Options de batterie */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('batteryOptions')}
          >
            <div className="flex items-center gap-3">
              <Battery className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Options de batterie</h2>
            </div>
            <div className="text-gray-500">
              {isExpanded.batteryOptions ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          
          {isExpanded.batteryOptions && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Batterie physique
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batteryOptions.physicalBattery}
                    onChange={(e) => setBatteryOptions({...batteryOptions, physicalBattery: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  MyBattery
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batteryOptions.myBattery}
                    onChange={(e) => setBatteryOptions({...batteryOptions, myBattery: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Smart Battery
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batteryOptions.smartBattery}
                    onChange={(e) => setBatteryOptions({...batteryOptions, smartBattery: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={handleSaveBatteryOptions}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enregistrer les options
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Options d'abonnement */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('subscriptionOptions')}
          >
            <div className="flex items-center gap-3">
              <ToggleLeft className="h-6 w-6 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900">Options d'abonnement</h2>
            </div>
            <div className="text-gray-500">
              {isExpanded.subscriptionOptions ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          
          {isExpanded.subscriptionOptions && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Activer l'abonnement
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscriptionEnabled}
                    onChange={handleToggleSubscription}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <p className="text-sm text-gray-600">
                {subscriptionEnabled 
                  ? 'L\'option d\'abonnement est activée. Les utilisateurs peuvent choisir entre le paiement comptant et l\'abonnement.'
                  : 'L\'option d\'abonnement est désactivée. Seul le paiement comptant est disponible.'}
              </p>
            </div>
          )}
        </div>

        {/* Liens utiles */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('usefulLinks')}
          >
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">Liens utiles</h2>
            </div>
            <div className="text-gray-500">
              {isExpanded.usefulLinks ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          
          {isExpanded.usefulLinks && (
            <div className="space-y-4 mt-4">
              <a
                href="https://abienergie.icoll.fr/auth/login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-gray-600" />
                <span className="text-gray-800">iColl</span>
              </a>
              
              <a
                href="https://www.abienergie.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-gray-600" />
                <span className="text-gray-800">Site web</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}