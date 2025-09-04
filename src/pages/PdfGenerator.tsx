import React, { useState } from 'react';
import PdfReportGenerator from '../components/PdfReportGenerator';

// Update template URL to use local public directory
const DEFAULT_TEMPLATE_URL = '/templates/Presentation_rapport.pdf';

export default function PdfGenerator() {
  const [clientInfo] = useState({
    nom: 'Doe',
    prenom: 'John',
    telephone: '0123456789',
    email: 'john.doe@example.com',
    adresse: '123 Main Street',
    codePostal: '75001',
    ville: 'Paris',
    date: new Date().toLocaleDateString(),
    ensoleillement: 'Optimal'
  });

  const [installation] = useState({
    typeCompteur: 'Linky',
    consommationAnnuelle: 5000,
    orientation: 180,
    inclinaison: 30,
    masqueSolaire: 0,
    puissanceCrete: 3
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Générateur de Rapport PDF</h1>
      <PdfReportGenerator
        clientInfo={clientInfo}
        installation={installation}
        templateUrl={DEFAULT_TEMPLATE_URL}
      />
    </div>
  );
}