# Frontend Role Architecture

## Overview

The frontend follows a clean separation between **routing** and **feature logic**. Route files under `app/[locale]/connected/` are thin entry points — they do not contain business logic, data fetching, or role-specific rendering. All of that lives in `src/features/`.

## Layer Responsibilities

```
app/[locale]/connected/
  page.tsx files        — route entry points only; import from features/
  layout.tsx            — auth guard + role-aware layout shell

src/features/
  tenant-specific       — renter-dashboard/, tenant-portal/, account/
  admin-specific        — admin-users/, admin-properties/, admin-pagination/,
                          contracts-upload/, tokenomics-calculator/
  shared/common         — access-control/, connected-home/, api-errors/,
                          auth-access/, password-reset/
```

## Feature Module Map

### Tenant Features

| Module | Path | Responsibility |
|--------|------|----------------|
| Renter Dashboard | `features/renter-dashboard/` | Tenant dashboard: ownership, rent insight, goals, payment history |
| Tenant Portal | `features/tenant-portal/` | My Contract, payment history API, tenant-specific API calls |
| Account | `features/account/` | My Account page for tenant users |

**Tenant dashboard entry point:**
`features/renter-dashboard/components/RenterDashboardModule.tsx` — fetches dashboard data, handles loading/error/empty states, renders `FmzRenterDashboard`.

### Admin Features

| Module | Path | Responsibility |
|--------|------|----------------|
| Admin Users | `features/admin-users/` | User management and roles |
| Admin Properties | `features/admin-properties/` | Property management |
| Admin Pagination | `features/admin-pagination/` | Shared pagination for admin lists |
| Contracts Upload | `features/contracts-upload/` | Contract upload flow |
| Tokenomics Calculator | `features/tokenomics-calculator/` | Tokenomics calculation tool |

**Admin dashboard UI:** `features/connected-home/components/DashboardAdmin.tsx` — legacy quick-links page rendered for `admin` dashboard kind.

### Common/Shared Features

| Module | Path | Responsibility |
|--------|------|----------------|
| Access Control | `features/access-control/` | Principal resolution, dashboard kind routing, RBAC types |
| Connected Home | `features/connected-home/` | Empty home state, shared dashboard feedback components, client-state helpers |
| API Errors | `features/api-errors/` | API error types and handlers |
| Auth Access | `features/auth-access/` | Auth flow components |
| Password Reset | `features/password-reset/` | Password reset flow |

## Dashboard Routing

The dashboard page (`app/[locale]/connected/dashboard/page.tsx`) resolves the user's role via `resolveDashboardKindFromAccess()` and renders:

| `FmzDashboardKind` | Renders |
|--------------------|---------|
| `admin` | `DashboardAdmin` from `features/connected-home/components/` |
| `renter` | `RenterDashboardModule` from `features/renter-dashboard/components/` |
| _(null)_ | `FmzConnectedEmptyHome` |

## Dependency Rules

Dependencies only flow inward:

```
app/[locale]/connected/page.tsx
  → features/[role-module]/components/
      → features/[role-module]/domain/
      → features/[shared-module]/
          → services/
          → external APIs
```

**Rules:**
- `app/` may import from `features/` — never the reverse
- Admin features must not import from tenant features, and vice versa
- Both may import from common/shared features
- `connected/` page files import only from `features/` — no business logic inline

## What Was Removed

**Investor/co-owner role** was removed entirely in May 2026. This included:

- `FmzDashboardKind` values `investor` and `legacyInvestor`
- Routes: `investorJoined/`, `investorList/`, `activeContract/`, `investPropertyAdmin/`, `reportAdminPaymentsInvestor/`
- Dashboard modules: `CoOwnerDashboardModule`, `LegacyCoOwnerDashboardModule`
- Record components: `InvestorsList`, `TokensPurchaseInvestorList`, `RentAdjustPurchaseInvestorList`, `RentDistributionList`, `RentDistributionAndRePurchasedTokensLists`, `TokensRePurchaseList`, `TokensRePurchaseListByInvestor`, `TokensRePurchaseListByLegacy`, `MaintenanceTableInvestor`
- Admin navigation entry: `admin.reports.payments_investor`

The two supported roles are now `admin` and `renter` (tenant).

## Content Width Standard

All tenant-facing pages use `max-w-[1360px]` as the content width constraint. This is provided by:
- `FmzConnectedPageShell width="tenant"` — for pages with `<main>` wrappers
- `FmzTenantContentFrame` — for legacy pages managing their own padding

Admin pages use `FmzAdminLayout`, which has its own shell.
