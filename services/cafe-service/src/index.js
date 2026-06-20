import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import cafeRoutes from './routes/cafes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'cafe-service', port: PORT });
});

// Routes
app.use('/cafes', cafeRoutes);

// Start server
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 cafe-service listening on port ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Fatal: cafe-service failed to start:', err.message);
    process.exit(1);
  }
}

start();
