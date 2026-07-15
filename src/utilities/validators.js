/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result { isValid: boolean, error?: string }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file uploaded' };
  }

  // Check file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Only JPG, PNG, WEBP allowed' };
  }

  return { isValid: true };
};

/**
 * Validate image ID format
 * @param {string} imageId - Image ID to validate
 * @returns {boolean} True if valid UUID format
 */
export const validateImageId = (imageId) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(imageId);
};

/**
 * Validate query parameters
 * @param {string} version - Image version to validate
 * @returns {boolean} True if valid version
 */
export const validateVersion = (version) => {
  const validVersions = ['original', 'thumbnail', 'medium', 'large'];
  return validVersions.includes(version);
};
