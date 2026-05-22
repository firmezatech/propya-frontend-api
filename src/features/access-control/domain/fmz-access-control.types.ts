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

export type FmzAccessControlPrincipal = {
  id: string;
  name: string;
  email: string;
  permissionKeys: string[];
  roleKeys: string[];
  accessiblePages: FmzAccessControlPage[];
  isAdmin: boolean;
};
