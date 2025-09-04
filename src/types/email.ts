export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded content
}

export interface EmailData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  power: string;
  subscriptionDuration: string;
  pdl: string;
  attachments: EmailAttachment[];
}