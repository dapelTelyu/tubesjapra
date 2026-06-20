import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import reviewRoutes from './routes/reviews.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'review-service', port: PORT });
});

// Routes
app.use('/reviews', reviewRoutes);

// Start server
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 review-service listening on port ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Fatal: review-service failed to start:', err.message);
    process.exit(1);
  }
}

start();
