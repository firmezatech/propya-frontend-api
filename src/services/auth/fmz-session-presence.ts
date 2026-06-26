import { getFirmezaAccessToken, hasFirmezaSession } from './auth-storage';

// One-account-per-browser presence channel.
//
// "Keep me connected" sessions live in localStorage and are visible to every tab,
// so the login guard detects them synchronously. Ephemeral sessions live in a tab's
// own sessionStorage and are invisible to other tabs through storage alone. This
// module closes that gap with two live cross-tab operations:
//
//   1. Presence probe  — asks whether any other tab holds a session.
//   2. Token request   — asks the session-holding tab to share its token so the
//                        requesting tab can join without showing the login form,
//                        preserving the one-account-per-browser invariant.
//
// Both are queried live rather than mirrored into shared storage: only tabs that
// genuinely hold a session ever reply, so there is no stale flag left behind after
// a browser restart or a crashed tab.

const PRESENCE_CHANNEL_NAME = 'fmz-auth-presence';
const PRESENCE_QUERY_TYPE = 'fmz-presence-query';
const PRESENCE_REPLY_TYPE = 'fmz-presence-reply';
const TOKEN_REQUEST_TYPE = 'fmz-token-request';
const TOKEN_REPLY_TYPE = 'fmz-token-reply';
const DEFAULT_PROBE_TIMEOUT_MS = 150;
const DEFAULT_TOKEN_REQUEST_TIMEOUT_MS = 500;

type PresenceQuery = { type: typeof PRESENCE_QUERY_TYPE; nonce: string };
type PresenceReply = { type: typeof PRESENCE_REPLY_TYPE; nonce: string };
type TokenRequest = { type: typeof TOKEN_REQUEST_TYPE; nonce: string };
type TokenReply = { type: typeof TOKEN_REPLY_TYPE; nonce: string; token: string };
type PresenceMessage = PresenceQuery | PresenceReply | TokenRequest | TokenReply;

const isPresenceChannelAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined';

const createNonce = (): string => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const noop = (): void => {};

// Answers presence probes and token requests from other tabs while this tab holds a
// session. Returns a cleanup function that closes the channel. No-op where
// BroadcastChannel is unavailable.
export function startSessionPresenceResponder(): () => void {
  if (!isPresenceChannelAvailable()) return noop;

  const channel = new BroadcastChannel(PRESENCE_CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<PresenceMessage>) => {
    if (!hasFirmezaSession()) return;

    if (event.data?.type === PRESENCE_QUERY_TYPE) {
      const reply: PresenceReply = { type: PRESENCE_REPLY_TYPE, nonce: event.data.nonce };
      channel.postMessage(reply);
      return;
    }

    if (event.data?.type === TOKEN_REQUEST_TYPE) {
      const token = getFirmezaAccessToken();
      if (!token) return;
      const reply: TokenReply = { type: TOKEN_REPLY_TYPE, nonce: event.data.nonce, token };
      channel.postMessage(reply);
    }
  };

  return () => channel.close();
}

// Asks other tabs whether any of them currently holds a session. Resolves true on the
// first matching reply, or false once the timeout elapses with no reply. Resolves false
// where BroadcastChannel is unavailable.
export function probeActiveSession(timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS): Promise<boolean> {
  if (!isPresenceChannelAvailable()) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    const channel = new BroadcastChannel(PRESENCE_CHANNEL_NAME);
    const nonce = createNonce();
    let isSettled = false;

    const settle = (sessionExistsElsewhere: boolean) => {
      if (isSettled) return;
      isSettled = true;
      window.clearTimeout(timeoutId);
      channel.close();
      resolve(sessionExistsElsewhere);
    };

    channel.onmessage = (event: MessageEvent<PresenceMessage>) => {
      if (event.data?.type === PRESENCE_REPLY_TYPE && event.data.nonce === nonce) settle(true);
    };

    const timeoutId = window.setTimeout(() => settle(false), timeoutMs);

    const query: PresenceQuery = { type: PRESENCE_QUERY_TYPE, nonce };
    channel.postMessage(query);
  });
}

// Asks the session-holding tab to share its token so the requesting tab can join the
// session without the login form. Resolves with the token string on success, or null
// if no tab replies within the timeout (e.g. the other tab closed between probe and
// request). Resolves null where BroadcastChannel is unavailable.
export function requestSessionToken(timeoutMs: number = DEFAULT_TOKEN_REQUEST_TIMEOUT_MS): Promise<string | null> {
  if (!isPresenceChannelAvailable()) return Promise.resolve(null);

  return new Promise<string | null>((resolve) => {
    const channel = new BroadcastChannel(PRESENCE_CHANNEL_NAME);
    const nonce = createNonce();
    let isSettled = false;

    const settle = (token: string | null) => {
      if (isSettled) return;
      isSettled = true;
      window.clearTimeout(timeoutId);
      channel.close();
      resolve(token);
    };

    channel.onmessage = (event: MessageEvent<PresenceMessage>) => {
      if (event.data?.type === TOKEN_REPLY_TYPE && event.data.nonce === nonce) {
        settle(event.data.token ?? null);
      }
    };

    const timeoutId = window.setTimeout(() => settle(null), timeoutMs);

    const request: TokenRequest = { type: TOKEN_REQUEST_TYPE, nonce };
    channel.postMessage(request);
  });
}
