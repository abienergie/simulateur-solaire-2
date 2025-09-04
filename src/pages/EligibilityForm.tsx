import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Shield, Cpu, Clock, Ruler, 
  Wrench, LineChart, ArrowLeft, Loader2, 
  AlertCircle, CheckCircle2, ExternalLink
} from 'lucide-react';
import { useClient } from '../contexts/client';
import { useSolarData } from '../hooks/useSolarData';
import { useFinancialProjection } from '../hooks/useFinancialProjection';
import { getPackageId } from '../utils/calculations/packageMapping';

const INSTALLATION_STEPS = [
  {
    icon: Clock,
    title: "Réponse sous 48H",
    duration: "2 jours",
    description: "Étude initiale de votre dossier"
  },
  {
    icon: Ruler,
    title: "Étude technique", 
    duration: "15 jours",
    description: "Analyse détaillée et dimensionnement"
  },
  {
    icon: FileText,
    title: "Démarches",
    duration: "30 jours", 
    description: "Autorisations administratives"
  },
  {
    icon: Wrench,
    title: "Installation",
    duration: "45 jours",
    description: "Pose et mise en service"
  },
  {
    icon: LineChart,
    title: "Monitoring",
    duration: "Permanent",
    description: "Suivi de production et maintenance"
  }
];

export default function EligibilityForm() {
  const navigate = useNavigate();
  const { clientInfo, address, updateClientInfo } = useClient();
  const { params } = useSolarData();
  const { parameters } = useFinancialProjection();
  
  const [pdl, setPdl] = useState('');
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [environmentPhotos, setEnvironmentPhotos] = useState<{ id: string; file: File }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [commercialId, setCommercialId] = useState<string>('');
  const [revenuFiscal, setRevenuFiscal] = useState(() => {
    return localStorage.getItem('revenuFiscal') || '';
  });

  const validateClientInfo = useCallback(() => {
    const errors = [];
    
    if (!clientInfo.civilite) errors.push("Civilité manquante");
    if (!clientInfo.nom) errors.push("Nom manquant");
    if (!clientInfo.prenom) errors.push("Prénom manquant");
    if (!clientInfo.telephone) errors.push("Téléphone manquant");
    if (!clientInfo.email) errors.push("Email manquant");
    
    const hasAddressInClientInfo = !!(clientInfo.adresse && clientInfo.codePostal && clientInfo.ville);
    const hasAddressInAddress = !!(address.rue && address.codePostal && address.ville);
    
    if (!hasAddressInClientInfo && !hasAddressInAddress) {
      if (!address.rue && !clientInfo.adresse) errors.push("Adresse manquante");
      if (!address.codePostal && !clientInfo.codePostal) errors.push("Code postal manquant");
      if (!address.ville && !clientInfo.ville) errors.push("Ville manquante");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [clientInfo, address]);

  useEffect(() => {
    validateClientInfo();
  }, [clientInfo, address, validateClientInfo]);

  // Vérifier l'éligibilité financière
  useEffect(() => {
    if (parameters.financingMode === 'subscription' && revenuFiscal) {
      const revenuAnnuel = parseInt(revenuFiscal, 10);
      if (revenuAnnuel > 0) {
        // Récupérer le coût mensuel total (abonnement + batterie)
        const totalMonthlyCost = parseFloat(localStorage.getItem('total_monthly_cost') || '0');
        const annualCost = totalMonthlyCost * 12;
        
        // Utiliser le seuil de 7% si une batterie est sélectionnée, sinon 4%
        const maxRatioPercentage = parameters.batterySelection?.type ? 7 : 4;
        const isEligible = (annualCost / revenuAnnuel * 100) <= maxRatioPercentage;
        
        if (!isEligible) {
          setError(`Votre revenu fiscal ne permet pas de souscrire à cet abonnement. L'annualité représente plus de ${maxRatioPercentage}% de votre revenu fiscal.`);
        } else {
          setError(null);
        }
      }
    }
  }, [parameters.financingMode, parameters.batterySelection, revenuFiscal]);

  const handlePDLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 14);
    setPdl(value);
  };

  const handleRevenuFiscalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setRevenuFiscal(value);
    
    if (value) {
      localStorage.setItem('revenuFiscal', value);
      const revenuAnnuel = parseInt(value, 10);
      
      // Vérifier l'éligibilité financière
      if (parameters.financingMode === 'subscription' && revenuAnnuel > 0) {
        // Récupérer le coût mensuel total (abonnement + batterie)
        const totalMonthlyCost = parseFloat(localStorage.getItem('total_monthly_cost') || '0');
        const annualCost = totalMonthlyCost * 12;
        
        // Utiliser le seuil de 7% si une batterie est sélectionnée, sinon 4%
        const maxRatioPercentage = parameters.batterySelection?.type ? 7 : 4;
        const isEligible = (annualCost / revenuAnnuel * 100) <= maxRatioPercentage;
        
        if (!isEligible) {
          setError(`Votre revenu fiscal ne permet pas de souscrire à cet abonnement. L'annualité représente plus de ${maxRatioPercentage}% de votre revenu fiscal.`);
        } else {
          setError(null);
        }
      }
    } else {
      localStorage.removeItem('revenuFiscal');
    }
  };

  const handleCommercialIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommercialId(value);
    localStorage.setItem('commercial_id', value);
  };

  const handleFileChange = (type: 'tax' | 'id') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximum : 10MB');
        return;
      }
      if (type === 'tax') {
        setTaxFile(file);
      } else {
        setIdFile(file);
      }
      setError(null);
    }
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('Une photo est trop volumineuse. Taille maximum : 10MB');
        return false;
      }
      return true;
    });

    const newPhotos = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file
    }));

    setEnvironmentPhotos(prev => [...prev, ...newPhotos]);
    setError(null);
  };

  const handlePhotoRemove = (id: string) => {
    setEnvironmentPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleSubmit = () => {
    updateClientInfo({
      adresse: address.rue,
      codePostal: address.codePostal,
      ville: address.ville
    });
    
    setTimeout(() => {
      if (!validateClientInfo()) {
        setError("Informations client incomplètes. Veuillez remplir tous les champs obligatoires.");
        return;
      }
      
      if (!commercialId) {
        setError("Veuillez saisir l'ID du chargé d'affaire.");
        return;
      }
      
      // Vérifier l'éligibilité financière pour l'abonnement
      if (parameters.financingMode === 'subscription' && revenuFiscal) {
        const revenuAnnuel = parseInt(revenuFiscal, 10);
        if (revenuAnnuel > 0) {
          // Récupérer le coût mensuel total (abonnement + batterie)
          const totalMonthlyCost = parseFloat(localStorage.getItem('total_monthly_cost') || '0');
          const annualCost = totalMonthlyCost * 12;
          
          // Utiliser le seuil de 7% si une batterie est sélectionnée, sinon 4%
          const maxRatioPercentage = parameters.batterySelection?.type ? 7 : 4;
          const isEligible = (annualCost / revenuAnnuel * 100) <= maxRatioPercentage;
          
          if (!isEligible) {
            setError(`Votre revenu fiscal ne permet pas de souscrire à cet abonnement. L'annualité représente plus de ${maxRatioPercentage}% de votre revenu fiscal.`);
            return;
          }
        }
      }
      
      setShowSuccessModal(true);
      setError(null);
    }, 100);
  };

  // Calculer le seuil d'éligibilité en fonction de la présence d'une batterie
  const eligibilityThreshold = parameters.batterySelection?.type ? 7 : 4;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/projection"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la projection financière
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Vérification d'éligibilité
      </h2>

      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">Informations client incomplètes</p>
              <p className="text-sm text-red-600 mt-1">
                Veuillez compléter les informations suivantes dans les étapes précédentes :
              </p>
              <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Étapes de votre installation
        </h3>
        <div className="relative flex justify-between">
          {INSTALLATION_STEPS.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center w-32">
              {index < INSTALLATION_STEPS.length - 1 && (
                <div 
                  className="absolute w-full h-[2px] top-7 left-[50%] bg-blue-200"
                  style={{
                    width: 'calc(200% - 2rem)'
                  }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-white rounded-full border-2 border-blue-500">
                <step.icon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-3 text-center">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full mb-2">
                  {step.duration}
                </span>
                <div className="text-sm font-medium text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500 mt-1">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 mt-8">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Numéro PDL (Point De Livraison)
            <div className="relative inline-block ml-2 group">
              <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-72 bottom-full left-1/2 -translate-x-1/2 mb-2">
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                Le numéro PDL (Point De Livraison) est un identifiant unique de 14 chiffres qui se trouve sur votre facture d'électricité et sur votre compteur Linky.
              </div>
            </div>
          </label>
          <input
            type="text"
            value={pdl}
            onChange={handlePDLChange}
            placeholder="14 chiffres"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            maxLength={14}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ID du chargé d'affaire
            <div className="relative inline-block ml-2 group">
              <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-72 bottom-full left-1/2 -translate-x-1/2 mb-2">
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                L'identifiant du chargé d\'affaire qui gère ce dossier. Cet ID est nécessaire pour associer le client au bon chargé d\'affaire dans iColl.
              </div>
            </div>
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={commercialId}
              onChange={handleCommercialIdChange}
              placeholder="ID du chargé d'affaire"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {parameters.financingMode === 'subscription' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Revenu fiscal de référence
              <div className="relative inline-block ml-2 group">
                <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-72 bottom-full left-1/2 -translate-x-1/2 mb-2">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  Le revenu fiscal de référence se trouve sur votre dernier avis d'imposition. Pour un abonnement avec batterie, l\'annualité ne doit pas dépasser 7% de ce revenu.
                </div>
              </div>
            </label>
            <input
              type="text"
              value={revenuFiscal}
              onChange={handleRevenuFiscalChange}
              placeholder="Montant en euros"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-blue-600">
              Pour un abonnement {parameters.batterySelection?.type ? 'avec batterie' : 'sans batterie'}, 
              l'annualité ne doit pas dépasser {eligibilityThreshold}% de votre revenu fiscal.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avis d'imposition
          </label>
          <div className={`relative flex items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
            taxFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-blue-500 bg-gray-50'
          }`}>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange('tax')}
              id="tax-file"
            />
            <label htmlFor="tax-file" className="cursor-pointer text-center">
              {taxFile ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">{taxFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Cpu className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">Cliquez pour sélectionner votre avis d'imposition</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pièce d'identité
          </label>
          <div className={`relative flex items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
            idFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-blue-500 bg-gray-50'
          }`}>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange('id')}
              id="id-file"
            />
            <label htmlFor="id-file" className="cursor-pointer text-center">
              {idFile ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">{idFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Cpu className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">Cliquez pour sélectionner votre pièce d'identité</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Photos de l'environnement
              <div className="relative inline-block ml-2 group">
                <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-80 bottom-full left-1/2 -translate-x-1/2 mb-2">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  Nous avons besoin de photos de :
                  • Votre toit à équiper
                  • L'environnement proche (arbres, bâtiments)
                  • Les éventuels masques solaires (ombres portées)
                </div>
              </div>
            </label>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {environmentPhotos.map(photo => (
                <div 
                  key={photo.id}
                  className="relative bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate">
                        {photo.file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(photo.id)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoAdd}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Cpu className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Ajouter des photos</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-600">{error}</div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={validationErrors.length > 0 || !commercialId || (parameters.financingMode === 'subscription' && error !== null)}
            className={`px-6 py-3 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              validationErrors.length > 0 || !commercialId || (parameters.financingMode === 'subscription' && error !== null)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Valider mon dossier
          </button>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-xl">
            <div className="flex">
              <div className="w-1/2">
                <img
                  src="https://i.ibb.co/GQr7gmd/maison-panneaux-solaires-toit.jpg"
                  alt="Maison avec panneaux solaires"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="w-1/2 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Félicitations !
                </h3>
                <div className="text-gray-600 mb-4">
                  Bienvenue dans le monde de demain ! Vous venez de faire le premier pas vers une énergie plus propre et plus économique.
                </div>
                <div className="text-gray-600 mb-6">
                  Notre équipe va étudier votre dossier et vous recevrez votre contrat d'abonnement sous 48H.
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}