import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'user-service', port: PORT });
});

// Routes
app.use('/users', userRoutes);

// Start server
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 user-service listening on port ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Fatal: user-service failed to start:', err.message);
    process.exit(1);
  }
}

start();
