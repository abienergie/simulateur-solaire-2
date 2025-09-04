import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration sécurisée pour Gmail
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: 'abienergie2025@gmail.com',
    pass: 'Abienergie2025@@'
  },
  debug: true // Pour le développement uniquement
});

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

export async function testEmailConnection(): Promise<void> {
  try {
    await transporter.verify();
    console.log('Connexion email établie avec succès');
  } catch (error) {
    console.error('Erreur de connexion email:', error);
    throw error;
  }
}