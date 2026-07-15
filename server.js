import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables BEFORE importing other modules
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import imageRoutes from '../Backend/src/routes/imageRoutes.js';
import healthRoutes from '../Backend/src/routes/healthRoutes.jss.js';
import { errorHandler } from '../Backend/src/middleware/errorHandler.jsr.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/images', imageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  Serverless Image Processing Backend           ║
║  Server running on http://localhost:${PORT}    ║
║  API Base URL: http://localhost:${PORT}/api    ║
║  Status: http://localhost:${PORT}/api/health   ║
╚════════════════════════════════════════════════╝
  `);
});

export default app;
