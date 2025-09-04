import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();

// Configuration CORS pour autoriser les requêtes du front-end
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '50mb' }));

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: 'mail.gandi.net',
  port: 587,
  secure: false, // TLS
  auth: {
    user: 'contact@abie.fr',
    pass: 'Quinze1526@'
  },
  tls: {
    rejectUnauthorized: false // À désactiver uniquement en développement
  }
});

app.post('/api/submit-application', async (req, res) => {
  try {
    const { clientName, clientEmail, clientPhone, power, subscriptionDuration, pdl, attachments } = req.body;

    // Construction du corps de l'email en HTML pour une meilleure présentation
    const emailBody = `
      <h2>Nouveau dossier de demande d'installation solaire</h2>
      
      <h3>Informations client</h3>
      <ul>
        <li><strong>Nom et prénom :</strong> ${clientName}</li>
        <li><strong>Email :</strong> ${clientEmail}</li>
        <li><strong>Téléphone :</strong> ${clientPhone}</li>
      </ul>

      <h3>Détails de l'installation</h3>
      <ul>
        <li><strong>Puissance :</strong> ${power}</li>
        <li><strong>Durée d'abonnement :</strong> ${subscriptionDuration}</li>
        <li><strong>PDL :</strong> ${pdl}</li>
      </ul>
    `;

    // Préparation des pièces jointes
    const mailAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      encoding: 'base64'
    }));

    // Envoi de l'email
    await transporter.sendMail({
      from: 'contact@abie.fr',
      to: 'contact@abie.fr',
      subject: `Nouvelle demande d'installation - ${clientName}`,
      html: emailBody,
      attachments: mailAttachments
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email'
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur email démarré sur le port ${PORT}`);
});