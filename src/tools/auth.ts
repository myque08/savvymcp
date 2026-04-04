import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabaseClient } from "../lib/supabase.js";
import {
  getSession,
  setSession,
  clearSession,
  refreshSubscriptionStatus,
} from "../lib/session.js";

const APP_DOMAIN = "https://www.savvyscratch.com";

export function registerAuthTools(server: McpServer): void {
  // --- register ---
  server.tool(
    "register",
    "Create a new Savvy Scratch account. After registering, you can browse free game previews. Subscribe to unlock full access to all game data and analysis.",
    {
      email: z.string().email().describe("Your email address"),
      password: z
        .string()
        .min(6)
        .describe("Choose a password (minimum 6 characters)"),
    },
    async ({ email, password }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Registration failed: ${error.message}\n\nAlready have an account? Use the \`login\` tool instead.`,
            },
          ],
        };
      }

      if (data.session) {
        setSession({
          accessToken: data.session.access_token,
          userId: data.user?.id ?? null,
          email,
          isSubscribed: false,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `Account created and logged in as ${email}.`,
                "",
                "You can now use these tools:",
                "- `list_states` — see which states we cover",
                "- `get_games` — preview the top 3 games per state (free)",
                "- `best_games` — find top picks within your budget (free preview)",
                "",
                "To unlock full game data and detailed prize breakdowns, subscribe with `get_subscribe_link`.",
              ].join("\n"),
            },
          ],
        };
      }

      // Email confirmation required
      return {
        content: [
          {
            type: "text" as const,
            text: `Check your email (${email}) to confirm your account, then use the \`login\` tool to sign in.`,
          },
        ],
      };
    }
  );

  // --- login ---
  server.tool(
    "login",
    "Sign in to your Savvy Scratch account to access scratch-off game data and analysis",
    {
      email: z.string().email().describe("Your Savvy Scratch email"),
      password: z.string().describe("Your password"),
    },
    async ({ email, password }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Login failed: ${error.message}\n\nDon't have an account? Use the \`register\` tool to create one.`,
            },
          ],
        };
      }

      setSession({
        accessToken: data.session.access_token,
        userId: data.user.id,
        email: data.user.email ?? email,
        isSubscribed: false,
      });

      await refreshSubscriptionStatus();
      const session = getSession();

      const statusLine = session.isSubscribed
        ? "You have an active subscription — full access unlocked."
        : "You're on the free tier. Use `get_subscribe_link` to subscribe ($5/mo or $50/yr) for full access.";

      return {
        content: [
          {
            type: "text" as const,
            text: `Logged in as ${email}. ${statusLine}`,
          },
        ],
      };
    }
  );

  // --- check_subscription ---
  server.tool(
    "check_subscription",
    "Check your current Savvy Scratch subscription status",
    {},
    async () => {
      const session = getSession();
      if (!session.accessToken || !session.userId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You're not logged in. Use the `login` tool to sign in first.",
            },
          ],
        };
      }

      await refreshSubscriptionStatus();

      if (!session.subscriptionDetails || !session.isSubscribed) {
        return {
          content: [
            {
              type: "text" as const,
              text: [
                `Logged in as: ${session.email}`,
                "Subscription: **None active**",
                "",
                "Subscribe for $5/month or $50/year to unlock:",
                "- All games in every state (not just top 3)",
                "- Detailed prize breakdowns per game",
                "- Budget-optimized recommendations",
                "",
                "Use `get_subscribe_link` to get your checkout link.",
              ].join("\n"),
            },
          ],
        };
      }

      const subscription = session.subscriptionDetails;
      const endDate = new Date(
        subscription.subscribedTillDate * 1000
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const planType =
        subscription.subType === "month"
          ? "Monthly ($5/mo)"
          : "Yearly ($50/yr)";
      const renewalStatus = subscription.endsOn
        ? "Cancels at end of period"
        : "Auto-renews";

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Logged in as: ${session.email}`,
              `Subscription: **Active**`,
              `Plan: ${planType}`,
              `Valid until: ${endDate}`,
              `Status: ${renewalStatus}`,
            ].join("\n"),
          },
        ],
      };
    }
  );

  // --- get_subscribe_link ---
  server.tool(
    "get_subscribe_link",
    "Get a link to subscribe to Savvy Scratch. Choose monthly ($5/mo) or yearly ($50/yr — save 17%).",
    {
      plan: z
        .enum(["monthly", "yearly"])
        .default("monthly")
        .describe("Subscription plan: monthly ($5/mo) or yearly ($50/yr)"),
    },
    async ({ plan }) => {
      const session = getSession();

      if (!session.accessToken || !session.email) {
        return {
          content: [
            {
              type: "text" as const,
              text: [
                "You need an account first before subscribing.",
                "",
                "1. **Register:** Use the `register` tool to create an account",
                "2. **Then subscribe:** Run `get_subscribe_link` again after logging in",
              ].join("\n"),
            },
          ],
        };
      }

      const price = plan === "monthly" ? "$5/month" : "$50/year (save 17%)";

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Subscribe to Savvy Scratch — ${price}`,
              "",
              `Complete your subscription here: ${APP_DOMAIN}/subscribe`,
              "",
              "What you get:",
              "- Full game data for all 19 states",
              "- Detailed prize breakdowns and odds analysis",
              "- Budget-optimized game recommendations",
              "- Pro gambler methodology applied to every game",
              "",
              "30-day money-back guarantee. Cancel anytime.",
            ].join("\n"),
          },
        ],
      };
    }
  );

  // --- logout ---
  server.tool(
    "logout",
    "Sign out of your Savvy Scratch account",
    {},
    async () => {
      const session = getSession();
      if (!session.accessToken) {
        return {
          content: [
            { type: "text" as const, text: "You're not currently logged in." },
          ],
        };
      }

      const email = session.email;
      clearSession();

      return {
        content: [
          {
            type: "text" as const,
            text: `Signed out of ${email}. Use \`login\` to sign back in.`,
          },
        ],
      };
    }
  );
}
