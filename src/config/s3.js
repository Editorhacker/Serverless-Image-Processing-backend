import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });


// AWS S3 Client configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_CONFIG = {
  bucket: process.env.S3_BUCKET_NAME,
  region: process.env.AWS_REGION || 'ap-south-1',
};

export default s3Client;
