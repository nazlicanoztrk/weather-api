import Fastify from 'fastify';
import dotenv from 'dotenv';
import { authRoutes } from './plugins/auth';
import { weatherRoutes } from './plugins/weather';

dotenv.config();

const app = Fastify();

// Load env variables
const SERVER_PORT = Number(process.env.SERVER_PORT) || 7777;
const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0';

// Register plugins
app.register(authRoutes);
app.register(weatherRoutes);

// Start server
app
  .listen({ port: SERVER_PORT, host: SERVER_HOST })
  .then(() => {
    console.log(`Server running at http://${SERVER_HOST}:${SERVER_PORT}`);
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
