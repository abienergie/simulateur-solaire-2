import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { useClient } from '../contexts/client';
import { scrollToTop } from '../utils/scroll';

interface NavigationButtonsProps {
  onReset: () => void;
  canProceed: boolean;
  result?: {
    productionAnnuelle: number;
    puissanceCrete: number;
    surfaceTotale: number;
  } | null;
}

export default function NavigationButtons({ onReset, canProceed, result }: NavigationButtonsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientInfo } = useClient();

  const hasRequiredInfo = Boolean(
    clientInfo.civilite &&
    clientInfo.nom &&
    clientInfo.prenom &&
    clientInfo.telephone &&
    clientInfo.email
  );

  const handleContinue = () => {
    if (!hasRequiredInfo) {
      alert('Veuillez remplir tous les champs obligatoires avant de continuer.');
      return;
    }

    if (!result) {
      alert('Veuillez attendre la fin du calcul avant de continuer.');
      return;
    }

    // Préserver l'état existant s'il existe
    const currentState = location.state || {};
    
    navigate('/projection', { 
      state: { 
        ...currentState,
        productionAnnuelle: result.productionAnnuelle,
        puissanceCrete: result.puissanceCrete,
        surfaceTotale: result.surfaceTotale
      }
    });
    scrollToTop();
  };

  return (
    <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Réinitialiser
      </button>

      <button
        type="button"
        disabled={!canProceed || !hasRequiredInfo}
        onClick={handleContinue}
        className={`inline-flex items-center px-6 py-2 shadow-sm text-sm font-medium rounded-md text-white transition-colors
          ${canProceed && hasRequiredInfo
            ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
            : 'bg-gray-300 cursor-not-allowed'}`}
      >
        Continuer
        <ArrowRight className="h-4 w-4 ml-2" />
      </button>
    </div>
  );
}