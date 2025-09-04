import React, { useState, useEffect } from 'react';
import { FileDown, Eye, Loader2, AlertCircle } from 'lucide-react';
import { fillPdfForm, downloadPdf, previewPdf } from '../utils/pdfFormFiller';
import { mergePdfs } from '../utils/pdfMerger';
import { FinancialProjection } from '../types/financial';
import PdfAttachmentUploader from './PdfAttachmentUploader';
import TechnicalDatasheetSelector from './TechnicalDatasheetSelector';

interface PdfAttachment {
  id: string;
  file: File;
  name: string;
}

interface ClientInfo {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  region: string;
  date: string;
  ensoleillement: string;
  conseiller: string;
  telephoneConseiller: string;
  commentaire: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  civilite: string;
  pdl?: string;
}

interface InstallationInfo {
  typeCompteur: string;
  consommationAnnuelle: number;
  orientation: number;
  inclinaison: number;
  masqueSolaire: number;
  puissanceCrete: number;
  degradationPanneau: number;
  nombreModules?: number;
  surfaceTotale?: number;
  pertes?: number;
}

interface PdfReportGeneratorProps {
  clientInfo: Partial<ClientInfo>;
  installation: InstallationInfo;
  templateUrl?: string;
  projection?: FinancialProjection;
  disabled?: boolean;
}

export default function PdfReportGenerator({
  clientInfo,
  installation,
  templateUrl = 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/pdf-template/rapport-pdf-template.pdf',
  projection,
  disabled = false
}: PdfReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PdfAttachment[]>([]);
  const [mapImageData, setMapImageData] = useState<string | null>(null);
  const [selectedDatasheets, setSelectedDatasheets] = useState<string[]>([]);

  // Load satellite image from localStorage on mount
  useEffect(() => {
    const savedImageUrl = localStorage.getItem('satellite_image_url');
    if (savedImageUrl) {
      // Create an image element to load the static map
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create a canvas to convert the image to data URL
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL('image/png');
            setMapImageData(dataUrl);
            console.log('Satellite image loaded from localStorage URL');
          } catch (e) {
            console.error('Error converting image to data URL:', e);
          }
        }
      };
      
      img.onerror = (e) => {
        console.error('Error loading satellite image from URL:', e);
      };
      
      img.src = savedImageUrl;
    }
  }, []);

  // Helper function to safely access and convert values
  const safeValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // Validate required data before generation
  const validateData = () => {
    const requiredClientFields: (keyof ClientInfo)[] = [
      'nom', 'prenom', 'telephone', 'email', 'civilite'
    ];

    const requiredAddressFields: (keyof ClientInfo)[] = [
      'adresse', 'codePostal', 'ville', 'region'
    ];

    const requiredInstallationFields: (keyof InstallationInfo)[] = [
      'typeCompteur', 'consommationAnnuelle', 'orientation',
      'inclinaison', 'masqueSolaire', 'puissanceCrete'
    ];

    // Check required client information
    const missingClientFields = requiredClientFields.filter(
      field => !clientInfo?.[field]
    );

    if (missingClientFields.length > 0) {
      throw new Error(`Informations client manquantes: ${missingClientFields.join(', ')}`);
    }

    // Check required address information
    const missingAddressFields = requiredAddressFields.filter(
      field => !clientInfo?.[field]
    );

    if (missingAddressFields.length > 0) {
      throw new Error(`Informations d'adresse manquantes: ${missingAddressFields.join(', ')}. Veuillez compléter l'adresse avant de générer le rapport.`);
    }

    // Check required installation information
    const missingInstallationFields = requiredInstallationFields.filter(
      field => installation?.[field] === undefined || installation?.[field] === null
    );

    if (missingInstallationFields.length > 0) {
      throw new Error(`Informations d'installation manquantes: ${missingInstallationFields.join(', ')}`);
    }

    if (!projection?.projectionAnnuelle?.length) {
      throw new Error('Les données de projection financière sont manquantes ou invalides');
    }
  };

  const generatePdf = async (action: 'download' | 'preview') => {
    setIsGenerating(true);
    setError(null);

    try {
      // Validate all required data first
      validateData();

      // Create safe copies of the data with proper string conversion
      const safeClientInfo = {
        ...clientInfo,
        nom: safeValue(clientInfo.nom),
        prenom: safeValue(clientInfo.prenom),
        telephone: safeValue(clientInfo.telephone),
        email: safeValue(clientInfo.email),
        adresse: safeValue(clientInfo.adresse),
        codePostal: safeValue(clientInfo.codePostal),
        ville: safeValue(clientInfo.ville),
        region: safeValue(clientInfo.region),
        date: safeValue(clientInfo.date),
        ensoleillement: safeValue(clientInfo.ensoleillement),
        conseiller: safeValue(clientInfo.conseiller),
        telephoneConseiller: safeValue(clientInfo.telephoneConseiller),
        commentaire: safeValue(clientInfo.commentaire),
        civilite: safeValue(clientInfo.civilite),
        pdl: safeValue(clientInfo.pdl),
        coordinates: clientInfo.coordinates ? {
          lat: Number(clientInfo.coordinates.lat) || 0,
          lon: Number(clientInfo.coordinates.lon) || 0
        } : undefined
      } as ClientInfo;

      const safeInstallation = {
        ...installation,
        typeCompteur: safeValue(installation.typeCompteur),
        consommationAnnuelle: Number(installation.consommationAnnuelle) || 0,
        orientation: Number(installation.orientation) || 0,
        inclinaison: Number(installation.inclinaison) || 0,
        masqueSolaire: Number(installation.masqueSolaire) || 0,
        puissanceCrete: Number(installation.puissanceCrete) || 0,
        degradationPanneau: Number(installation.degradationPanneau) || 0,
        nombreModules: Number(installation.nombreModules) || Math.ceil(installation.puissanceCrete * 2), // ~500W par panneau
        surfaceTotale: Number(installation.surfaceTotale) || (installation.nombreModules ? installation.nombreModules * 2.25 : installation.puissanceCrete * 4.5),
        pertes: Number(installation.pertes) || 14
      };
      
      // Remplir le formulaire PDF avec les données sécurisées
      const pdfBytes = await fillPdfForm(
        templateUrl,
        safeClientInfo,
        safeInstallation,
        mapImageData,
        projection,
        selectedDatasheets
      );
      
      // Si des pièces jointes sont présentes, les fusionner avec le PDF principal
      let finalPdfBytes = pdfBytes;
      if (attachments.length > 0) {
        finalPdfBytes = await mergePdfs(pdfBytes, attachments.map(att => att.file));
      }
      
      // Télécharger ou prévisualiser le PDF selon l'action demandée
      if (action === 'download') {
        const filename = `Rapport_${safeClientInfo.nom}_${safeClientInfo.prenom}.pdf`;
        downloadPdf(finalPdfBytes, filename);
      } else {
        previewPdf(finalPdfBytes);
      }
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      let errorMessage = 'Une erreur est survenue lors de la génération du PDF';
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible d\'accéder au modèle de rapport PDF. Veuillez vérifier votre connexion internet et réessayer.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => generatePdf('download')}
          disabled={isGenerating || disabled}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <FileDown className="h-5 w-5" />
              Télécharger le rapport
            </>
          )}
        </button>
        
        <button
          onClick={() => generatePdf('preview')}
          disabled={isGenerating || disabled}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Eye className="h-5 w-5" />
              Prévisualiser
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-4">
        <TechnicalDatasheetSelector
          selectedDatasheets={selectedDatasheets}
          onSelectedDatasheetsChange={setSelectedDatasheets}
        />
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <PdfAttachmentUploader 
          attachments={attachments}
          onAttachmentsChange={setAttachments}
        />
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Le rapport inclut toutes les informations client et les détails de l'installation</p>
      </div>
    </div>
  );
}