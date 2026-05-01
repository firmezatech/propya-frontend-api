# FMZ Token Frontend Authentication Fixes

## Problem
The backend now requires authenticated requests and role/ownership authorization. The frontend was calling protected endpoints directly without sending the JWT returned by `/login`.

## Solution
This version centralizes API authentication in a single HTTP client and updates only the files needed to support the secured backend.

## Implemented changes

### Centralized authentication storage
New file: `src/services/auth/auth-storage.ts`

Responsibilities:
- Store the backend access token after login.
- Read the token in O(1) from localStorage.
- Clear token and user session on logout or unauthorized responses.
- Keep the existing `walletChanged` event behavior.

### Centralized Firmeza API client
New file: `src/services/firmeza-api-client.ts`

Responsibilities:
- Use `NEXT_PUBLIC_FIRMEZA_API_URL` as the backend base URL.
- Attach `Authorization: Bearer <token>` to every protected backend request.
- Clear the local session automatically on HTTP 401.
- Provide `authenticatedFirmezaFetch` for existing fetch-based endpoints.

### Login flow
Updated files:
- `src/services/login-fmz-api.ts`
- `src/app/[locale]/components/Home.tsx`
- `src/app/[locale]/components/HomeCalculator.tsx`

Changes:
- Login now accepts `accessToken` or `token` from the backend response.
- Token is stored after successful login.
- User profile is consistently stored for route/profile behavior.

### Protected API calls
Updated files:
- `src/services/login-fmz-api.ts`
- `src/services/contact-fmz-api.ts`
- `src/services/web3-api.ts`
- `src/services/web3Admin-api.ts`
- `src/services/gamification-api.ts`

Changes:
- Calls to secured backend endpoints now use the authenticated client.
- Fetch-based secured calls now use `authenticatedFirmezaFetch`.
- Gamification API calls also send the same bearer token.

### Connected area guard
New file:
- `src/app/[locale]/connected/components/AuthenticatedRoute.tsx`

Updated file:
- `src/app/[locale]/connected/layout.tsx`

Changes:
- Connected pages redirect to `/` when there is no authenticated session.

### Logout
Updated file:
- `src/app/[locale]/connected/components/UserConnected.tsx`

Changes:
- Logout clears token, wallet, name, and profile consistently.

### Environment variables
Updated files:
- `.env.example`
- `.env-prod`
- `next.config.mjs`
- `docs/env.local.example`

Required variables:

```env
NEXT_PUBLIC_FIRMEZA_API_URL="https://your-backend-url"
NEXT_PUBLIC_FMZ_API_TIMEOUT_MS="30000"
NEXT_PUBLIC_FMZ_AUTH_TOKEN_STORAGE_KEY="fmz_access_token"
NEXT_PUBLIC_GAMIFICATION_API="https://your-backend-url"
```

## Security notes
- The frontend only sends the JWT and hides protected screens without a token.
- Real authorization remains enforced by the backend: admin-only routes and wallet ownership checks must stay server-side.
- No sensitive secrets should be stored in frontend `.env` files because `NEXT_PUBLIC_*` variables are exposed to the browser.
