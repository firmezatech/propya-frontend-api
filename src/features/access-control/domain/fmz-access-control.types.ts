export type FmzAccessControlPage = { id: string; key: string; name: string; label: string; path: string };
export type FmzAccessControlPermission = { id: string; key: string; label: string; pageKeys: string[] };
export type FmzAccessControlRole = { id: string; name: string; description: string; color: string; permissionKeys: string[]; isProtected: boolean };
export type FmzAccessControlCatalog = { pages: FmzAccessControlPage[]; permissions: FmzAccessControlPermission[] };
export type FmzRolePayload = { name: string; description?: string; color?: string; permissionKeys: string[] };

export type FmzAccessControlPrincipal = { id: string; name: string; email: string; permissionKeys: string[]; roleKeys: string[]; isAdmin: boolean };
