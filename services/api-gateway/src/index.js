import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs/index.js';
import { resolvers } from './schema/resolvers/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'spf_super_secret_key_change_in_production';

const SERVICE_URLS = {
  user:   process.env.USER_SERVICE_URL   || 'http://user-service:3001',
  cafe:   process.env.CAFE_SERVICE_URL   || 'http://cafe-service:3002',
  review: process.env.REVIEW_SERVICE_URL || 'http://review-service:3003',
  folder: process.env.FOLDER_SERVICE_URL || 'http://folder-service:3004',
  note:   process.env.NOTE_SERVICE_URL   || 'http://note-service:3005'
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend SPA (index.html)
app.use(express.static(path.join(__dirname, '../public')));

// REST: Health check for the gateway itself
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    upstreamServices: SERVICE_URLS
  });
});

// REST: Aggregate health check — pings all downstream services
app.get('/health/all', async (_req, res) => {
  const checks = await Promise.allSettled(
    Object.entries(SERVICE_URLS).map(async ([name, url]) => {
      const r = await fetch(`${url}/health`);
      const d = await r.json();
      return { name, status: r.ok ? 'OK' : 'FAIL', ...d };
    })
  );
  const results = checks.map((c, i) => ({
    service: Object.keys(SERVICE_URLS)[i],
    ...(c.status === 'fulfilled' ? c.value : { status: 'UNREACHABLE', error: c.reason?.message })
  }));
  const allOk = results.every(r => r.status === 'OK');
  res.status(allOk ? 200 : 207).json({ gateway: 'OK', services: results });
});

// Apollo GraphQL Server
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();

  // Mount GraphQL middleware with JWT context extraction
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          return { userId: decoded.userId, role: decoded.role };
        } catch (_) {
          // Invalid or expired token — return unauthenticated context
        }
      }
      return {};
    }
  }));

  app.listen(PORT, () => {
    console.log(`🚀 [api-gateway] Server started on port ${PORT}`);
    console.log(`🔗 GraphQL Playground: http://localhost:${PORT}/graphql`);
    console.log(`🔗 Health Check:       http://localhost:${PORT}/health`);
    console.log(`🔗 All Services:       http://localhost:${PORT}/health/all`);
    console.log(`📡 Upstream services:`);
    Object.entries(SERVICE_URLS).forEach(([name, url]) => {
      console.log(`   ${name.padEnd(7)} → ${url}`);
    });
  });
}

startServer().catch((err) => {
  console.error('[api-gateway] Failed to start:', err);
  process.exit(1);
});
