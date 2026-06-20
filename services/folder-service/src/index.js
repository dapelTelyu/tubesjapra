import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import folderRoutes from './routes/folders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'folder-service', port: PORT });
});

// Routes
app.use('/folders', folderRoutes);

// Start server
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 folder-service listening on port ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Fatal: folder-service failed to start:', err.message);
    process.exit(1);
  }
}

start();
