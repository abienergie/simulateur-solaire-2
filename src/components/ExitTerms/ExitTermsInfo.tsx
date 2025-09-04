import React from 'react';
import { ENGAGEMENT_PERIOD } from '../../utils/constants/exitTermsConstants';
import { HelpCircle } from 'lucide-react';

export default function ExitTermsInfo() {
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <p className="text-sm text-amber-800">
            Les {ENGAGEMENT_PERIOD} premières années sont grisées car elles correspondent à la période d'engagement minimum.
            Aucune sortie n'est possible pendant cette période
          </p>
          <div className="relative group">
            <HelpCircle className="h-4 w-4 text-amber-600 cursor-help flex-shrink-0" />
            <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-80 -right-2 top-6">
              <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
              <p className="font-medium mb-1">Cas particuliers de sortie anticipée :</p>
              <ul className="space-y-1">
                <li>• Décès du souscripteur</li>
                <li>• Divorce ou dissolution de PACS</li>
                <li>• Déménagement hors zone de couverture</li>
              </ul>
              <p className="mt-2 text-xs text-gray-300">
                Ces situations font l'objet d'une étude au cas par cas et peuvent permettre une sortie anticipée sans pénalités.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Les valeurs indiquées correspondent aux montants à verser pour sortir du contrat à la date anniversaire de l'année correspondante.
          Ces montants sont garantis et incluent la TVA.
        </p>
      </div>
    </div>
  );
}