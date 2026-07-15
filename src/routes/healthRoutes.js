import express from 'express';
import { healthCheckController } from '../controllers/healthController.js';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  const result = healthCheckController();
  res.json(result);
});

export default router;
