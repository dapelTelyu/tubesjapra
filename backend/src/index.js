import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { testDbConnections } from './config/db.js';
import { typeDefs } from './schema/typeDefs/index.js';
import { resolvers } from './schema/resolvers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'spf_super_secret_key_change_in_production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// REST Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend service is running',
    timestamp: new Date().toISOString()
  });
});

const server = new ApolloServer({
  typeDefs,
  resolvers
});

async function startServer() {
  await server.start();
  
  // Mount GraphQL middleware with JWT context
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          return { userId: decoded.userId, role: decoded.role };
        } catch (err) {
          // Invalid/expired token — return empty context (unauthenticated)
        }
      }
      return {};
    }
  }));

  // Attempt database connection verification
  try {
    await testDbConnections();
  } catch (err) {
    console.error('Fatal: Database connection verification failed. App exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server successfully started on port ${PORT}`);
    console.log(`🔗 REST Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 GraphQL Playground: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
