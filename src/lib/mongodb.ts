import dns from 'node:dns';
import {
  MongoClient,
  GridFSBucket,
  type Db,
  type MongoClientOptions,
} from 'mongodb';

/**
 * Reusable MongoDB connection.
 *
 * The client promise is cached on `globalThis` so that Next.js hot reloads in
 * development do not open a new connection pool on every refresh, and so all
 * route handlers share one pool in production.
 */

function cleanEnvString(val?: string): string | undefined {
  if (!val) return undefined;
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

const rawUri = cleanEnvString(process.env.MONGODB_URI);
const dbName = cleanEnvString(process.env.MONGODB_DB) || 'sassy_classy';

/** GridFS bucket that stores uploaded product image bytes. */
export const IMAGE_BUCKET = cleanEnvString(process.env.MONGODB_IMAGE_BUCKET) || 'productImages';

/** Collection names live here so every module agrees on them. */
export const COLLECTIONS = {
  products: 'products',
  orders: 'orders',
  movements: 'movements',
  settings: 'settings',
  newsletter: 'newsletter',
} as const;

/** Strip credentials from error messages or URIs to prevent leaking secrets. */
export function sanitizeErrorMessage(msg: string): string {
  return msg.replace(/\/\/[^:]+:[^@]+@/g, '//***:***@');
}

/** Thrown when the app is used before MongoDB has been configured. */
export class MongoNotConfiguredError extends Error {
  constructor() {
    super(
      'MongoDB is not configured. Add MONGODB_URI (and MONGODB_DB) to .env.local and restart the server.'
    );
    this.name = 'MongoNotConfiguredError';
  }
}

/** Thrown when MongoDB connection fails (network, DNS, authentication, etc.). */
export class MongoConnectionError extends Error {
  code: string;
  constructor(message: string, code = 'DATABASE_CONNECTION_ERROR') {
    super(message);
    this.name = 'MongoConnectionError';
    this.code = code;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __sassyClassyMongoClient: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(rawUri);
}

export function getDatabaseName(): string {
  return dbName;
}

/**
 * Configure DNS resolution for MongoDB Atlas SRV connection strings.
 *
 * On Windows local machines, VPNs, or certain local routers, Node.js's c-ares
 * resolver (`dns.resolveSrv`) defaults to `127.0.0.1` or an ISP DNS that refuses
 * SRV queries, producing `querySrv ECONNREFUSED _mongodb._tcp.cluster...`.
 *
 * Configuring public DNS resolvers (Cloudflare 1.1.1.1, Google 8.8.8.8) or custom
 * servers from `process.env.DNS_SERVERS` ensures SRV lookups resolve reliably.
 */
export function applyDnsResolvers(forcePublic = false): void {
  try {
    const custom = process.env.DNS_SERVERS?.split(',').map((s) => s.trim()).filter(Boolean);
    if (custom && custom.length > 0) {
      dns.setServers(custom);
      return;
    }

    const current = dns.getServers();
    const isLoopbackOnly = current.every(
      (s) => s === '127.0.0.1' || s === '::1' || s.startsWith('127.')
    );

    if (forcePublic || isLoopbackOnly || current.length === 0) {
      dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1', '8.8.4.4']);
    }
  } catch (err) {
    console.warn('[mongodb] Could not adjust DNS servers:', err);
  }
}

function normalizeMongoError(error: unknown): Error {
  if (error instanceof MongoNotConfiguredError || error instanceof MongoConnectionError) {
    return error;
  }
  const rawMsg = error instanceof Error ? error.message : String(error);

  if (rawMsg.includes('querySrv') || (rawMsg.includes('ECONNREFUSED') && rawMsg.includes('_mongodb._tcp'))) {
    console.error('[mongodb:dns-error]', sanitizeErrorMessage(rawMsg));
    return new MongoConnectionError(
      'Unable to connect to MongoDB Atlas because the DNS server could not resolve the SRV record. Please check your internet connection or DNS configuration.',
      'MONGO_DNS_ERROR'
    );
  }

  if (rawMsg.includes('Authentication failed') || rawMsg.includes('bad auth')) {
    console.error('[mongodb:auth-error]', 'Authentication failed for MongoDB user.');
    return new MongoConnectionError(
      'Database authentication failed. Please check your database user credentials in .env.local.',
      'MONGO_AUTH_ERROR'
    );
  }

  if (rawMsg.includes('Server selection timed out') || rawMsg.includes('ETIMEDOUT')) {
    console.error('[mongodb:timeout-error]', sanitizeErrorMessage(rawMsg));
    return new MongoConnectionError(
      'Database connection timed out. Please check your MongoDB Atlas Network Access IP Whitelist.',
      'MONGO_NETWORK_TIMEOUT'
    );
  }

  console.error('[mongodb:connection-error]', sanitizeErrorMessage(rawMsg));
  return new MongoConnectionError(
    'Unable to connect to MongoDB. Please check your database settings and network connection.',
    'DATABASE_ERROR'
  );
}

async function createClient(): Promise<MongoClient> {
  if (!rawUri) throw new MongoNotConfiguredError();

  if (rawUri.startsWith('mongodb+srv://')) {
    applyDnsResolvers(false);
  }

  const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  };

  try {
    const client = new MongoClient(rawUri, options);
    return await client.connect();
  } catch (initialError: unknown) {
    const isSrvDnsError =
      initialError instanceof Error &&
      (initialError.message.includes('querySrv') ||
        initialError.message.includes('ECONNREFUSED') ||
        initialError.message.includes('ENOTFOUND') ||
        (initialError as { code?: string }).code === 'ECONNREFUSED');

    if (rawUri.startsWith('mongodb+srv://') && isSrvDnsError) {
      console.warn(
        '[mongodb] Initial SRV DNS lookup failed. Retrying connection with public DNS resolvers (1.1.1.1, 8.8.8.8)...'
      );
      applyDnsResolvers(true);
      try {
        const client = new MongoClient(rawUri, options);
        return await client.connect();
      } catch (retryError) {
        throw normalizeMongoError(retryError);
      }
    }

    throw normalizeMongoError(initialError);
  }
}

export function getClient(): Promise<MongoClient> {
  if (!globalThis.__sassyClassyMongoClient) {
    globalThis.__sassyClassyMongoClient = createClient().catch((error) => {
      // Don't cache a failed connection — let the next request retry.
      globalThis.__sassyClassyMongoClient = undefined;
      throw error;
    });
  }
  return globalThis.__sassyClassyMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

/** Shared GridFS bucket for product images. */
export async function getImageBucket(): Promise<GridFSBucket> {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: IMAGE_BUCKET });
}

/** Cheap connectivity probe used by the health/session endpoints. */
export async function pingMongo(): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return true;
  } catch (error) {
    console.warn('[mongodb:ping-failed]', sanitizeErrorMessage(error instanceof Error ? error.message : String(error)));
    return false;
  }
}

