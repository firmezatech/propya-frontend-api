import { hasFirmezaSession } from './auth-storage';

// One-account-per-browser presence channel.
//
// "Keep me connected" sessions live in localStorage and are visible to every tab,
// so the login guard detects them synchronously. Ephemeral sessions live in a tab's
// own sessionStorage and are invisible to other tabs through storage alone. This
// module closes that gap with a live cross-tab query: a tab about to show the login
// form asks every other tab whether one of them currently holds a session, and any
// tab that does answers.
//
// The presence is queried live rather than mirrored into shared storage on purpose:
// only tabs that genuinely hold a session ever reply, so there is no stale "someone
// is logged in" flag left behind after a browser restart or a crashed tab.

const PRESENCE_CHANNEL_NAME = 'fmz-auth-presence';
const PRESENCE_QUERY_TYPE = 'fmz-presence-query';
const PRESENCE_REPLY_TYPE = 'fmz-presence-reply';
const DEFAULT_PROBE_TIMEOUT_MS = 150;

type PresenceQuery = { type: typeof PRESENCE_QUERY_TYPE; nonce: string };
type PresenceReply = { type: typeof PRESENCE_REPLY_TYPE; nonce: string };
type PresenceMessage = PresenceQuery | PresenceReply;

const isPresenceChannelAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined';

const createNonce = (): string => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const noop = (): void => {};

// Answers presence queries from other tabs while this tab holds a session. Returns a
// cleanup function that closes the channel. No-op where BroadcastChannel is unavailable.
export function startSessionPresenceResponder(): () => void {
  if (!isPresenceChannelAvailable()) return noop;

  const channel = new BroadcastChannel(PRESENCE_CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<PresenceMessage>) => {
    if (event.data?.type !== PRESENCE_QUERY_TYPE) return;
    if (!hasFirmezaSession()) return;

    const reply: PresenceReply = { type: PRESENCE_REPLY_TYPE, nonce: event.data.nonce };
    channel.postMessage(reply);
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
