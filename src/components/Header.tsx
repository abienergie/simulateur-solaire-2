import React from 'react';
import { Sun } from 'lucide-react';
import Logo from './Logo';
import { useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const hideHero = ['/modalites-abonnement', '/modalites-sortie'].includes(location.pathname);

  if (hideHero) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <Logo />
            </div>
            <div className="flex items-center space-x-3">
              <Sun className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Simulateur Solaire
              </h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative w-full bg-gradient-to-b from-blue-900 to-blue-700">
      <div className="absolute inset-0">
        <img
          src="https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/graphique//Solar%20Panels%20on%20Rooftop.avif"
          alt="Solar panels under blue sky with sun"
          className="w-full h-80 object-cover brightness-50"
        />
      </div>
      
      <div className="relative z-10 h-80">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0">
            <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex-shrink-0">
                  <Logo />
                </div>
                <div className="flex items-center space-x-3">
                  <Sun className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400" />
                  <h1 className="text-xl sm:text-2xl font-semibold text-white">
                    Simulateur Solaire
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center">
            <div className="w-full">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    Optimisez votre transition énergétique
                  </h2>
                  <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto">
                    Calculez votre potentiel solaire et découvrez les économies possibles 
                    avec une installation photovoltaïque adaptée à vos besoins
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}