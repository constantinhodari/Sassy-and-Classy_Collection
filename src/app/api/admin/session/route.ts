import { isAdmin, isAdminAuthConfigured } from '@/lib/adminAuth';
import { getDatabaseName, isMongoConfigured, pingMongo } from '@/lib/mongodb';
import { maxImageBytes } from '@/lib/imageValidation';
import { allowInsecureImageUrls } from '@/lib/productSchema';

/** Reports the current admin session so the UI can show the login gate. */
export async function GET() {
  const mongoConfigured = isMongoConfigured();
  return Response.json({
    authenticated: await isAdmin(),
    adminAuthConfigured: isAdminAuthConfigured(),
    mongoConfigured,
    mongoConnected: mongoConfigured ? await pingMongo() : false,
    database: mongoConfigured ? getDatabaseName() : null,
    maxImageUploadMb: maxImageBytes() / 1024 / 1024,
    allowInsecureImageUrls: allowInsecureImageUrls(),
  });
}
