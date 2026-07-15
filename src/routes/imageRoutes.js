import express from 'express';
import { upload } from '../middleware/multerConfig.js';
import {
  uploadImageController,
  getAllImagesController,
  getImageDetailsController,
  downloadImageController,
} from '../controllers/imageController.js';

const router = express.Router();

/**
 * POST /api/images/upload
 * Upload and process an image
 */
router.post('/upload', upload.single('image'), async (req, res, next) => {
  try {
    const result = await uploadImageController(req.file);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/images
 * Get all images
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await getAllImagesController();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/images/:imageId
 * Get image details
 */
router.get('/:imageId', async (req, res, next) => {
  try {
    const result = await getImageDetailsController(req.params.imageId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/images/:imageId/download/:version
 * Download specific image version
 */
router.get('/:imageId/download/:version', async (req, res, next) => {
  try {
    const result = await downloadImageController(req.params.imageId, req.params.version);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
