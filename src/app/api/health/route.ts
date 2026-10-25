import { getDatabaseName, isMongoConfigured, pingMongo } from '@/lib/mongodb';
import { isAdminAuthConfigured } from '@/lib/adminAuth';
import { maxImageBytes } from '@/lib/imageValidation';
import { allowInsecureImageUrls } from '@/lib/productSchema';

/** Connectivity probe — reports whether MongoDB is configured and reachable. */
export async function GET() {
  const mongoConfigured = isMongoConfigured();
  const mongoConnected = mongoConfigured ? await pingMongo() : false;
  return Response.json({
    mongoConfigured,
    mongoConnected,
    database: mongoConfigured ? getDatabaseName() : null,
    adminAuthConfigured: isAdminAuthConfigured(),
    maxImageUploadMb: maxImageBytes() / 1024 / 1024,
    allowInsecureImageUrls: allowInsecureImageUrls(),
  });
}
