/**
 * Returns true only for relative paths that begin with a single `/`.
 * Rejects absolute URLs (`https://…`), protocol-relative URLs (`//…`),
 * and any other external references.
 *
 * This guard is applied before any router.push() call with a backend-supplied URL.
 * Both admin and tenant notification handlers import from here.
 */
export function isSafeInternalPath(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}
