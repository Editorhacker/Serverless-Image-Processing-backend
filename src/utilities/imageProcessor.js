import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_CONFIG } from '../config/s3.js';

/**
 * Helper to upload buffer to S3
 */
const uploadToS3 = async (buffer, key, mimeType = 'image/jpeg') => {
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });
  await s3Client.send(command);
  return key; // return the S3 key instead of a large Base64 string
};

/**
 * Process uploaded image and create multiple versions
 * @param {Buffer} buffer - Image file buffer
 * @param {string} fileName - Original file name
 * @returns {Promise<Object>} Processed image data with multiple versions
 */
export const processImage = async (buffer, fileName) => {
  const imageId = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Create processed versions object
    const results = {
      id: imageId,
      name: fileName,
      uploadedAt: timestamp,
      status: 'processing',
      original: null,
      thumbnail: null,
      medium: null,
      large: null,
      originalSize: buffer.length,
      thumbnailSize: 0,
      mediumSize: 0,
      largeSize: 0,
      width: metadata.width,
      height: metadata.height,
    };

    const createWatermark = (w, h) => {
      const text = 'ImagePro';
      const fontSize = Math.max(12, Math.floor(Math.min(w, h) * 0.05));
      const svg = `
        <svg width="${w}" height="${h}">
          <style>
            .title { fill: rgba(255, 255, 255, 0.6); font-size: ${fontSize}px; font-family: sans-serif; font-weight: bold; text-anchor: end; }
          </style>
          <text x="${w - 10}" y="${h - 10}" class="title">${text}</text>
        </svg>
      `;
      return Buffer.from(svg);
    };

    // Process and store images in different sizes

    // Thumbnail (150px)
    const thumbnailBuffer = await sharp(buffer)
      .resize(150, 150, { fit: 'cover' })
      .composite([{ input: createWatermark(150, 150) }])
      .jpeg({ quality: 80 })
      .toBuffer();
    results.thumbnail = await uploadToS3(thumbnailBuffer, `images/${imageId}/thumbnail.jpg`);
    results.thumbnailSize = thumbnailBuffer.length;

    // Medium (500px)
    const mediumBuffer = await sharp(buffer)
      .resize(500, 500, { fit: 'cover' })
      .composite([{ input: createWatermark(500, 500) }])
      .jpeg({ quality: 85 })
      .toBuffer();
    results.medium = await uploadToS3(mediumBuffer, `images/${imageId}/medium.jpg`);
    results.mediumSize = mediumBuffer.length;

    // Large (1200px)
    const largeBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'cover' })
      .composite([{ input: createWatermark(1200, 1200) }])
      .jpeg({ quality: 90 })
      .toBuffer();
    results.large = await uploadToS3(largeBuffer, `images/${imageId}/large.jpg`);
    results.largeSize = largeBuffer.length;

    // Original (optimized)
    const originalBuffer = await sharp(buffer)
      .composite([{ input: createWatermark(metadata.width, metadata.height) }])
      .jpeg({ quality: 95 })
      .toBuffer();
    results.original = await uploadToS3(originalBuffer, `images/${imageId}/original.jpg`);
    results.originalSize = originalBuffer.length;

    // Mark as completed
    results.status = 'completed';

    return results;
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

/**
 * Decode base64 image string to buffer
 * @param {string} base64String - Base64 encoded image
 * @returns {Buffer} Image buffer
 */
export const decodeBase64Image = (base64String) => {
  const base64Data = base64String.split(',')[1];
  return Buffer.from(base64Data, 'base64');
};
