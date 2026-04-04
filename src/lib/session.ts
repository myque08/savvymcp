import { McpSession } from "./types.js";
import { getSupabaseClient } from "./supabase.js";

/**
 * In-memory session for the current MCP connection.
 * Each MCP client connection gets its own server process,
 * so this is effectively per-user.
 */
let currentSession: McpSession = {
  accessToken: null,
  userId: null,
  email: null,
  isSubscribed: false,
};

export function getSession(): McpSession {
  return currentSession;
}

export function setSession(session: Partial<McpSession>): void {
  currentSession = { ...currentSession, ...session };
}

export function clearSession(): void {
  currentSession = {
    accessToken: null,
    userId: null,
    email: null,
    isSubscribed: false,
  };
}

/**
 * Refreshes subscription status using the user's own auth session.
 * Calls getUser() which returns the user's metadata including subscription info.
 */
export async function refreshSubscriptionStatus(): Promise<boolean> {
  if (!currentSession.accessToken) return false;

  const supabase = getSupabaseClient();

  // Set the session so getUser() returns the current user's data
  await supabase.auth.setSession({
    access_token: currentSession.accessToken,
    refresh_token: "",
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(currentSession.accessToken);

  if (error || !user) return false;

  const subscription = user.app_metadata?.subscription;
  if (!subscription) {
    currentSession.isSubscribed = false;
    return false;
  }

  // Store subscription details for later use
  currentSession.subscriptionDetails = subscription;

  const now = Math.floor(Date.now() / 1000);
  const isActive =
    subscription.subscribedTillDate > now &&
    subscription.periodType !== "PAUSED";

  currentSession.isSubscribed = isActive;
  return isActive;
}
