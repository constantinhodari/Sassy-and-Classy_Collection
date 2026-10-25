import { MongoNotConfiguredError, MongoConnectionError, sanitizeErrorMessage } from '@/lib/mongodb';
import { ImageValidationError } from '@/lib/imageValidation';
import { DuplicateSkuError } from '@/lib/dataStore';

/** Map known server errors onto safe JSON responses. */
export function errorResponse(error: unknown): Response {
  if (error instanceof MongoNotConfiguredError) {
    return Response.json({ error: error.message, code: 'MONGO_NOT_CONFIGURED' }, { status: 503 });
  }
  if (error instanceof MongoConnectionError) {
    return Response.json({ error: error.message, code: error.code }, { status: 503 });
  }
  if (error instanceof ImageValidationError) {
    return Response.json({ error: error.message, code: 'INVALID_IMAGE' }, { status: 400 });
  }
  if (error instanceof DuplicateSkuError) {
    return Response.json({ error: error.message, code: 'DUPLICATE_SKU' }, { status: 409 });
  }

  // Check for raw MongoDB driver connection failures (DNS, timeout, network error)
  const errName = error instanceof Error ? error.name : '';
  const errMsg = error instanceof Error ? error.message : '';
  if (
    errName === 'MongoServerSelectionError' ||
    errName === 'MongoNetworkError' ||
    errName === 'MongoTopologyClosedError' ||
    errMsg.includes('querySrv') ||
    errMsg.includes('ECONNREFUSED')
  ) {
    console.error('[api:database-error]', sanitizeErrorMessage(errMsg));
    return Response.json(
      {
        error:
          'Database connection error. Unable to reach MongoDB Atlas. Please check your network or DNS settings.',
        code: 'DATABASE_ERROR',
      },
      { status: 503 }
    );
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  console.error('[api]', error);
  return Response.json({ error: message, code: 'SERVER_ERROR' }, { status: 500 });
}

/** Wrap a route handler so unexpected failures become JSON, never HTML. */
export function route<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
