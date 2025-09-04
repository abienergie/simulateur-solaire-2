import axios from 'axios';
import type { EmailData } from '../../types/email';

export async function sendDossier(data: EmailData): Promise<void> {
  try {
    // Validation des données
    if (!data.clientName || !data.clientEmail || !data.clientPhone || !data.pdl) {
      throw new Error('Données client manquantes');
    }

    if (!data.attachments || data.attachments.length === 0) {
      throw new Error('Pièces jointes manquantes');
    }

    // Ensure we're sending a plain object without any Symbol properties
    const cleanData = {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      power: data.power,
      subscriptionDuration: data.subscriptionDuration,
      pdl: data.pdl,
      attachments: data.attachments.map(att => ({
        filename: att.filename,
        content: att.content
      }))
    };

    const response = await axios.post('/api/send-dossier', cleanData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Échec de l\'envoi du dossier');
    }
  } catch (error) {
    console.error('Email sending error:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Le délai d\'envoi a expiré. Veuillez réessayer.');
      }
      throw new Error(error.response?.data?.error || 'Erreur réseau lors de l\'envoi du dossier');
    }
    throw new Error('Une erreur est survenue lors de l\'envoi du dossier');
  }
}