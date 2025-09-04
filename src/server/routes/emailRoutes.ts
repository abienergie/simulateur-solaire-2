import { Router } from 'express';
import { transporter, MAX_ATTACHMENT_SIZE } from '../config/email';

const router = Router();

router.post('/send-dossier', async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      power,
      subscriptionDuration,
      pdl,
      attachments
    } = req.body;

    // Validation des données
    if (!clientName || !clientEmail || !clientPhone || !pdl || !attachments) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes'
      });
    }

    // Vérification de la taille des pièces jointes
    const totalSize = attachments.reduce((sum, att) => {
      return sum + Buffer.from(att.content, 'base64').length;
    }, 0);

    if (totalSize > MAX_ATTACHMENT_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'Taille totale des pièces jointes trop importante'
      });
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nouveau dossier de demande d'installation solaire</h2>
        
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
          <li><strong>Point de Livraison (PDL) :</strong> ${pdl}</li>
        </ul>
      </div>
    `;

    await transporter.sendMail({
      from: '"Abi Énergie" <abienergie.92@gmail.com>',
      to: 'contact@abie.fr',
      subject: `Nouvelle demande de dossier client - ${clientName}`,
      html: emailBody,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64'
      }))
    });

    res.json({ 
      success: true,
      message: 'Dossier envoyé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email'
    });
  }
});

export default router;