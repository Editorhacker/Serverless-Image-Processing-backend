import { saveImage, getImage, getAllImages, imageExists } from '../config/database.js';
import { processImage } from '../utilities/imageProcessor.js';
import { validateImageFile, validateImageId, validateVersion } from '../utilities/validators.js';
import { ApiError } from '../middleware/errorHandler.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_CONFIG } from '../config/s3.js';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Helper to convert stream to buffer
const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

// Helper to generate presigned URLs locally
const generatePresignedUrl = async (key) => {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiration
};

// Helper to hydrate image object with URLs
const hydrateImageUrls = async (image) => {
  if (!image) return null;
  return {
    ...image,
    original: await generatePresignedUrl(image.original),
    thumbnail: await generatePresignedUrl(image.thumbnail),
    medium: await generatePresignedUrl(image.medium),
    large: await generatePresignedUrl(image.large),
  };
};

/**
 * Upload and process image
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} Processed image data
 */
export const uploadImageController = async (file) => {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new ApiError(400, validation.error);
  }

  try {
    // Process image
    const processedImage = await processImage(file.buffer, file.originalname);

    // Save to database
    const savedImage = await saveImage(processedImage.id, processedImage);
    const hydratedImage = await hydrateImageUrls(savedImage);

    return {
      success: true,
      message: 'Image uploaded successfully',
      image: hydratedImage,
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new ApiError(500, 'Image processing failed', error.message);
  }
};

/**
 * Get all images
 * @returns {Promise<Object>} List of all images with metadata
 */
export const getAllImagesController = async () => {
  try {
    const imageList = await getAllImages();
    const hydratedImages = await Promise.all(imageList.map(hydrateImageUrls));

    return {
      success: true,
      count: hydratedImages.length,
      images: hydratedImages.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)),
    };
  } catch (error) {
    console.error('Error fetching images:', error);
    throw new ApiError(500, 'Failed to fetch images');
  }
};

/**
 * Get single image details
 * @param {string} imageId - Image ID
 * @returns {Promise<Object>} Image details
 */
export const getImageDetailsController = async (imageId) => {
  // Validate image ID
  if (!validateImageId(imageId)) {
    throw new ApiError(400, 'Invalid image ID format');
  }

  // Get image from database
  const image = await getImage(imageId);

  if (!image) {
    throw new ApiError(404, 'Image not found');
  }

  const hydratedImage = await hydrateImageUrls(image);

  return {
    success: true,
    image: hydratedImage,
  };
};

/**
 * Download image version
 * @param {string} imageId - Image ID
 * @param {string} version - Image version (original, thumbnail, medium, large)
 * @returns {Promise<Object>} { buffer, mimeType, filename }
 */
export const downloadImageController = async (imageId, version) => {
  // Validate image ID
  if (!validateImageId(imageId)) {
    throw new ApiError(400, 'Invalid image ID format');
  }

  // Validate version
  if (!validateVersion(version)) {
    throw new ApiError(400, 'Invalid image version. Must be: original, thumbnail, medium, or large');
  }

  // Get image from database
  const image = await getImage(imageId);

  if (!image) {
    throw new ApiError(404, 'Image not found');
  }

  // Get image data (which is now the S3 Key)
  const imageKey = image[version];

  if (!imageKey) {
    throw new ApiError(404, `Image version '${version}' not found`);
  }

  try {
    // Fetch from S3
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: imageKey,
    });
    
    const s3Response = await s3Client.send(command);
    const buffer = await streamToBuffer(s3Response.Body);

    return {
      success: true,
      buffer,
      mimeType: s3Response.ContentType || 'image/jpeg',
      filename: `image-${version}.jpg`,
    };
  } catch (error) {
    console.error('Error downloading image from S3:', error);
    throw new ApiError(500, 'Failed to process image download');
  }
};
