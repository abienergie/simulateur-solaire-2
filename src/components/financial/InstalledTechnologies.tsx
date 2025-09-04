import React, { useState } from 'react';
import { Cpu, Info, ChevronDown, ChevronRight } from 'lucide-react';
import Tooltip from '../Tooltip';
import { formatCurrency } from '../../utils/formatters';
import { calculateEnphaseCost } from '../../utils/calculations/priceCalculator';

interface InstalledTechnologiesProps {
  financingMode: 'cash' | 'subscription';
  inverterType: 'central' | 'solenso' | 'enphase';
  onInverterChange: (type: 'central' | 'solenso' | 'enphase') => void;
  bifacial: boolean;
  onBifacialChange: (enabled: boolean) => void;
  installedPower: number;
  mountingSystem: 'surimposition' | 'bac-lestes' | 'integration';
  onMountingSystemChange: (type: 'surimposition' | 'bac-lestes' | 'integration') => void;
}

export default function InstalledTechnologies({
  financingMode,
  inverterType,
  onInverterChange,
  bifacial,
  onBifacialChange,
  installedPower,
  mountingSystem,
  onMountingSystemChange
}: InstalledTechnologiesProps) {
  // Calculer le surcoût Enphase selon les nouvelles règles
  const enphaseAdditionalCost = inverterType === 'enphase' ? 
    calculateEnphaseCost(installedPower) : 0;
    
  // Calculer le nombre de panneaux (approximatif)
  const numberOfPanels = Math.ceil(installedPower * 2); // ~500W par panneau
    
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 p-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Cpu className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Technologies installées
          </h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-blue-100">
          {/* Choix de l'onduleur */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Type d'onduleur
              </label>
              <Tooltip content="L'onduleur convertit le courant continu des panneaux en courant alternatif compatible avec votre installation électrique. Les micro-onduleurs optimisent la production de chaque panneau individuellement." />
            </div>
            <select
              value={inverterType}
              onChange={(e) => onInverterChange(e.target.value as 'central' | 'solenso' | 'enphase')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="central">Onduleur centralisé</option>
              <option value="solenso">Micro-onduleur Solenso (1 pour 2 panneaux) - option offerte</option>
              <option value="enphase" disabled={financingMode === 'subscription'}>
                Micro-onduleur Enphase (1 par panneau) {inverterType === 'enphase' && `+ ${formatCurrency(enphaseAdditionalCost)}`}
              </option>
            </select>
          </div>

          {/* Choix du panneau */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Type de panneau
              </label>
              <Tooltip content="Les panneaux bifaciaux captent la lumière des deux côtés, augmentant la production jusqu'à 10% selon les conditions d'installation." />
            </div>
            <select
              value={bifacial ? 'bifacial' : 'monofacial'}
              onChange={(e) => onBifacialChange(e.target.value === 'bifacial')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="monofacial">Module standard</option>
              <option value="bifacial">Module bifacial haute performance - option offerte</option>
            </select>
          </div>
          
          {/* Système de fixation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Système de fixation
              </label>
              <Tooltip content="Le système de fixation détermine comment les panneaux sont installés sur votre toit. La surimposition est la méthode standard, les bacs lestés sont utilisés pour les toits plats, et l'intégration remplace une partie de la toiture." />
            </div>
            <select
              value={mountingSystem}
              onChange={(e) => onMountingSystemChange(e.target.value as 'surimposition' | 'bac-lestes' | 'integration')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={financingMode === 'subscription'}
            >
              <option value="surimposition">Surimposition (ISB)</option>
              <option value="bac-lestes" disabled={financingMode === 'subscription'}>
                Bac léstés {mountingSystem === 'bac-lestes' && `+ ${formatCurrency(60 * numberOfPanels)}`}
              </option>
              <option value="integration" disabled={financingMode === 'subscription'}>
                Intégration (IAB) {mountingSystem === 'integration' && `+ ${formatCurrency(100 * numberOfPanels)}`}
              </option>
            </select>
            
            {financingMode === 'subscription' && mountingSystem !== 'surimposition' && (
              <p className="mt-1 text-sm text-amber-600">
                Les options bac léstés et intégration ne sont pas disponibles en abonnement
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}