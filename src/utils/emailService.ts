import axios from 'axios';

interface EmailAttachment {
  filename: string;
  content: string;
}

interface SendEmailParams {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  power: string;
  subscriptionDuration: string;
  pdl: string;
  attachments: EmailAttachment[];
}

export async function sendApplicationEmail(params: SendEmailParams): Promise<void> {
  try {
    const response = await axios.post('http://localhost:3000/api/submit-application', params);
    
    if (!response.data.success) {
      throw new Error('Échec de l\'envoi de l\'email');
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}