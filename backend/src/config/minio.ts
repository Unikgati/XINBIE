import * as Minio from 'minio';
import { config } from './index';

const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(config.minio.bucket);
  if (!exists) {
    await minioClient.makeBucket(config.minio.bucket);
    // Set public read policy
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${config.minio.bucket}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(config.minio.bucket, JSON.stringify(policy));
  }
  console.log(`✅ MinIO bucket "${config.minio.bucket}" ready`);
}

export function getFileUrl(objectName: string): string {
  const protocol = config.minio.useSSL ? 'https' : 'http';
  return `${protocol}://${config.minio.endpoint}:${config.minio.port}/${config.minio.bucket}/${objectName}`;
}

export default minioClient;
