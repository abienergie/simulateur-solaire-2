import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Package, User, Calendar, Zap } from 'lucide-react';
import { useClient } from '../contexts/client';
import { useSolarData } from '../hooks/useSolarData';
import { useFinancialProjection } from '../hooks/useFinancialProjection';

export default function SimulatedIcollRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientInfo, address } = useClient();
  const { params } = useSolarData();
  const { parameters } = useFinancialProjection();
  
  const searchParams = new URLSearchParams(location.search);
  const clientId = searchParams.get('clientId');

  // Calculer la puissance et la durée
  const powerInKw = params.nombreModules * params.puissanceModules / 1000;
  const duration = parameters.dureeAbonnement || 20;

  const handleBack = () => {
    navigate('/eligibilite');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Simulation iColl
          </h1>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <p className="text-gray-700 mb-2">
            <strong>Note:</strong> Cette page simule la redirection vers iColl en environnement de développement.
          </p>
          <p className="text-gray-600">
            Dans l'environnement de production, l'utilisateur serait redirigé vers la page de connexion iColl.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-6 w-6 text-blue-500" />
              <h3 className="font-medium text-gray-900">Informations client</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Nom:</span>{' '}
                <span className="text-gray-900">{clientInfo.civilite} {clientInfo.nom} {clientInfo.prenom}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Adresse:</span>{' '}
                <span className="text-gray-900">{address.rue}, {address.codePostal} {address.ville}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Contact:</span>{' '}
                <span className="text-gray-900">{clientInfo.telephone} | {clientInfo.email}</span>
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-5 rounded-lg border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <Package className="h-6 w-6 text-green-500" />
              <h3 className="font-medium text-gray-900">Détails du package</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Client ID:</span>{' '}
                <span className="text-gray-900 font-mono">{clientId || 'Non spécifié'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Puissance:</span>{' '}
                <span className="text-gray-900">{powerInKw.toFixed(1)} kWc</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Durée d'abonnement:</span>{' '}
                <span className="text-gray-900">{duration} ans</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Détails de l'installation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h4 className="font-medium text-gray-900">Production</h4>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {Math.round(params.nombreModules * params.puissanceModules * 1.1)} kWh/an
                </p>
                <p className="text-xs text-gray-500 mt-1">Estimation basée sur votre localisation</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <h4 className="font-medium text-gray-900">Installation</h4>
                </div>
                <p className="text-lg font-bold text-indigo-600">
                  45 jours
                </p>
                <p className="text-xs text-gray-500 mt-1">Délai moyen après validation</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium text-gray-900">Équipement</h4>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {params.nombreModules} panneaux
                </p>
                <p className="text-xs text-gray-500 mt-1">Panneaux haute performance</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-blue-800 text-sm">
              Après connexion sur iColl, le commercial verrait le client et pourrait finaliser le devis.
              Les informations seraient automatiquement importées dans le système iColl.
            </p>
          </div>
        </div>

        <div className="flex justify-start">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'éligibilité
          </button>
        </div>
      </div>
    </div>
  );
}