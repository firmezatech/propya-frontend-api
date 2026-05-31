export type FmzAccessControlPage = {
  id: string;
  key: string;
  name: string;
  label: string;
  path: string;
  order: number;
  requiredPermission?: string;
  showInDropdown?: boolean;
};

export type FmzAccessControlPermission = {
  id: string;
  key: string;
  label: string;
  description?: string;
  pageKeys: string[];
  pages?: FmzAccessControlPage[];
};

export type FmzAccessControlRole = {
  id: string;
  name: string;
  description: string;
  color: string;
  permissionKeys: string[];
  isProtected: boolean;
};

export type FmzRolePayload = { name: string; description?: string; color?: string; permissionKeys: string[] };

export type FmzAccessControlCatalog = { pages: FmzAccessControlPage[]; permissions: FmzAccessControlPermission[] };

// Standardized authenticated-user identity returned by the backend
// (POST /login, GET /me/access) under `user`. The connected header/dropdown reads
// the display name from here first, falling back to localStorage only when absent.
export type FmzAuthenticatedUserIdentity = {
  id?: string;
  name?: string;
  displayName?: string;
  fullName?: string | null;
  email?: string;
  initials?: string;
  role?: string | null;
  roles?: string[];
};

export type FmzAccessControlPrincipal = {
  id: string;
  name: string;
  /** Backend display name (full name → email prefix → neutral fallback). Mirrors `name`. */
  displayName: string;
  email: string;
  /** Backend-provided initials; empty when the backend did not supply them. */
  initials: string;
  permissionKeys: string[];
  roleKeys: string[];
  accessiblePages: FmzAccessControlPage[];
  isAdmin: boolean;
};
