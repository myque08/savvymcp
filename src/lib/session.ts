import { McpSession } from "./types.js";
import { getSupabaseAdmin } from "./supabase.js";

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

export async function refreshSubscriptionStatus(): Promise<boolean> {
  if (!currentSession.userId) return false;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.getUserById(
    currentSession.userId
  );

  if (error || !data?.user) return false;

  const subscription = data.user.app_metadata?.subscription;
  if (!subscription) {
    currentSession.isSubscribed = false;
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const isActive =
    subscription.subscribedTillDate > now &&
    subscription.periodType !== "PAUSED";

  currentSession.isSubscribed = isActive;
  return isActive;
}
