'use client';

import { useEffect } from 'react';
import { startSessionPresenceResponder } from '../../services/auth/fmz-session-presence';

// Mounted once at the app root so every tab answers cross-tab "is anyone logged in?"
// probes from the login page while this tab holds a session. Renders nothing — its only
// job is to keep the presence responder alive for the lifetime of the tab.
export function FmzSessionPresenceResponder() {
  useEffect(() => startSessionPresenceResponder(), []);
  return null;
}
