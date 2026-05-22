# RBAC dashboard routing

The connected dashboard does not use the legacy numeric `profile` / `effectiveProfile` value to decide which UI should be rendered.

The frontend reads the authenticated user's access from the backend and uses the fields aligned with the `admin_panel` schema:

- `roles` / `role` / `roleKeys`: values derived from `admin_panel.roles.role_key`.
- `permissionKeys`: values derived from `admin_panel.permissions.permission_key`.
- `accessiblePages[].key`: values derived from `admin_panel.pages.page_key`.
- `accessiblePages[].requiredPermission`: value derived from `admin_panel.pages.required_permission_key`.
- `accessiblePages[].path`: value derived from `admin_panel.pages.path`.
- `accessiblePages[].order`: value derived from `admin_panel.pages.order_index`.
- `accessiblePages[].showInDropdown`: optional value derived from `admin_panel.pages.show_in_dropdown`; use `false` for authorized routes that should only be opened from buttons or direct links.

## Source of truth

The backend is the source of truth for authorization:

```txt
users -> user_roles -> roles -> role_permissions -> permissions -> permission_pages -> pages
```

The frontend must not infer access from hardcoded profile numbers. It only renders what the backend already resolved.

## Dashboard decision priority

The dashboard resolver uses this priority:

1. `accessiblePages[].key`
2. `permissionKeys`
3. `roleKeys` fallback only

This matters because multiple roles can share the same frontend route, for example `/connected/dashboard`. The frontend should therefore never decide by path only.

## Expected current access response

`GET /admin/access-control/me` should return at least:

```json
{
  "user": {
    "id": "uuid",
    "name": "Diana Aguilar",
    "email": "diana@email.com",
    "role": "tenant",
    "roles": ["tenant"],
    "permissionKeys": ["tenant.dashboard.view", "tenant.profile.view"],
    "accessiblePages": [
      {
        "key": "tenant.dashboard",
        "label": "Dashboard",
        "path": "/connected/dashboard",
        "order": 1000,
        "requiredPermission": "tenant.dashboard.view",
        "showInDropdown": true
      }
    ]
  }
}
```

## Canonical page and permission keys

The frontend defaults are aligned with the provided SQL seed/model:

- Admin dashboard: `admin.dashboard` / `admin.dashboard.view`
- Admin users: `admin.users` / `admin.users.view`
- Admin roles: `admin.roles` / `admin.roles.view`
- Tenant dashboard: `tenant.dashboard` / `tenant.dashboard.view`
- Tenant profile: `tenant.profile` / `tenant.profile.view`
- Tenant contract: `tenant.contract` / `tenant.contracts.view`
- Tenant payment history: `tenant.payment_history` / `tenant.payments.view`
- Tenant invoice issue: `tenant.issue_invoice` / `tenant.invoices.issue`

## Admin sidebar

The admin sidebar is rendered only when the current user has at least one backend-resolved `accessiblePages[].key` that starts with `admin.`.

The sidebar items are built from `accessiblePages`, not from local page arrays. The local config is only a fallback for icon mapping and default labels while data is loading.

## Connected user dropdown

The connected user dropdown also uses `accessiblePages`, but it only renders pages where `showInDropdown !== false`. This allows operational pages such as `/connected/comingSoon` to remain authorized by RBAC while being reached only from dashboard buttons, not as standalone dropdown menu entries.
