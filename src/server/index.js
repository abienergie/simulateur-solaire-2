import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import enedisRoutes from './routes/enedisRoutes.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://fabulous-praline-ae9982.netlify.app'
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Enedis routes
app.use('/api/enedis', enedisRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});