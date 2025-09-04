import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import emailRoutes from './routes/emailRoutes';
import { testEmailConnection } from './config/email';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://votre-domaine.com'
    : 'http://localhost:5173',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '50mb' }));

// Test de la connexion email au démarrage
testEmailConnection().catch(error => {
  console.error('Erreur de connexion email au démarrage:', error);
});

app.use('/api', emailRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});