import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSession, refreshSubscriptionStatus } from "../lib/session.js";
import { SUPABASE_URL } from "../lib/supabase.js";
import { GameEvaluation, GameInfo, State } from "../lib/types.js";

const FREE_GAME_LIMIT = 3;

async function fetchGames(
  stateCode: string,
  accessToken: string
): Promise<GameInfo[]> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/games?state=${stateCode}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) throw new Error(`Failed to fetch games: ${res.statusText}`);
  return res.json();
}

async function fetchStates(accessToken: string): Promise<State[]> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/states`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.statusText}`);
  return res.json();
}

function formatGameSummary(game: GameInfo): string {
  const evaluation =
    game.evaluation === GameEvaluation.Good
      ? "Good"
      : game.evaluation === GameEvaluation.New
        ? "New"
        : game.evaluation === GameEvaluation.Neutral
          ? "Neutral"
          : "Bad";

  return [
    `**${game.game_name}** (#${game.game_number_raw})`,
    `  Price: $${game.price_raw} | Evaluation: ${evaluation} | Score: ${Number(game.weighted_score || 0).toFixed(2)}`,
    `  Odds: 1 in ${Number(game.odds_raw || 0).toFixed(2)} | Remaining tickets: ${Number(game.remaining_tickets || 0).toLocaleString()}`,
  ].join("\n");
}

function formatGameDetailed(game: GameInfo): string {
  const lines = [formatGameSummary(game), "", "  Prize Tiers:"];

  for (const prize of game.prizes_data) {
    const amount = prize.amountDisplay || `$${Number(prize.amount || 0).toLocaleString()}`;
    lines.push(
      `    ${amount}: ${prize.prizesRemaining}/${prize.prizesInGame} remaining (odds: 1 in ${Number(prize.newOdds || 0).toFixed(0)})`
    );
  }

  lines.push(
    "",
    `  Total prizes claimed: ${Number(game.total_prizes_claimed || 0).toLocaleString()}`,
    `  Estimated tickets sold: ${Number(game.estimated_tickets_sold || 0).toLocaleString()}`
  );

  return lines.join("\n");
}

export function registerGameTools(server: McpServer): void {
  // --- list_states ---
  server.tool(
    "list_states",
    "List all U.S. states with scratch-off game data available on Savvy Scratch",
    {},
    async () => {
      const session = getSession();
      if (!session.accessToken) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You need to log in first. Use the `login` tool with your Savvy Scratch email and password. Don't have an account? Use `register` to create one — it's free to browse!",
            },
          ],
        };
      }

      const states = await fetchStates(session.accessToken);
      const list = states
        .map((s) => `- **${s.display_name}** (${s.code})`)
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Savvy Scratch covers ${states.length} states:\n\n${list}`,
          },
        ],
      };
    }
  );

  // --- get_games ---
  server.tool(
    "get_games",
    "Get scratch-off games for a state. Free users see the top 3 games; subscribers see all games with full details. Filter by evaluation (Good, New, Neutral, Bad) and sort by odds, name, or price.",
    {
      state: z
        .string()
        .length(2)
        .describe("Two-letter state code (e.g., TX, FL, CA)"),
      evaluation: z
        .enum(["Good", "New", "Neutral", "Bad", "All"])
        .default("All")
        .describe("Filter by game evaluation rating"),
      sort: z
        .enum(["odds", "name", "price_asc", "price_desc", "score"])
        .default("score")
        .describe("Sort order for results"),
    },
    async ({ state, evaluation, sort }) => {
      const session = getSession();
      if (!session.accessToken) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You need to log in first. Use the `login` tool to sign in, or `register` to create a free account.",
            },
          ],
        };
      }

      let games = await fetchGames(state.toLowerCase(), session.accessToken);

      // Filter by evaluation
      if (evaluation !== "All") {
        const evalMap: Record<string, GameEvaluation> = {
          Good: GameEvaluation.Good,
          New: GameEvaluation.New,
          Neutral: GameEvaluation.Neutral,
          Bad: GameEvaluation.Bad,
        };
        games = games.filter((g) => g.evaluation === evalMap[evaluation]);
      }

      // Sort
      switch (sort) {
        case "odds":
          games.sort((a, b) => Number(a.odds_raw) - Number(b.odds_raw));
          break;
        case "name":
          games.sort((a, b) => String(a.game_name).localeCompare(String(b.game_name)));
          break;
        case "price_asc":
          games.sort((a, b) => Number(a.price_raw) - Number(b.price_raw));
          break;
        case "price_desc":
          games.sort((a, b) => Number(b.price_raw) - Number(a.price_raw));
          break;
        case "score":
          games.sort((a, b) => Number(b.weighted_score || 0) - Number(a.weighted_score || 0));
          break;
      }

      await refreshSubscriptionStatus();
      const isSub = session.isSubscribed;

      if (!isSub) {
        // Free tier: show top 3 with summary only
        const preview = games.slice(0, FREE_GAME_LIMIT);
        const lines = preview.map(formatGameSummary);

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `Top ${preview.length} scratch-off games in ${state.toLowerCase()} (of ${games.length} total):\n`,
                ...lines,
                "",
                `🔒 Subscribe to Savvy Scratch ($5/mo or $50/yr) to see all ${games.length} games with full prize breakdowns and detailed analysis.`,
                `Use the \`get_subscribe_link\` tool to get your checkout link.`,
              ].join("\n"),
            },
          ],
        };
      }

      // Subscriber: full list
      const lines = games.map(formatGameSummary);
      return {
        content: [
          {
            type: "text" as const,
            text: `All ${games.length} scratch-off games in ${state.toLowerCase()}:\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    }
  );

  // --- game_details ---
  server.tool(
    "game_details",
    "Get detailed prize breakdown for a specific scratch-off game. Requires a Savvy Scratch subscription.",
    {
      state: z
        .string()
        .length(2)
        .describe("Two-letter state code (e.g., TX, FL, CA)"),
      game_name: z
        .string()
        .describe(
          "Game name or partial match to search for (case-insensitive)"
        ),
    },
    async ({ state, game_name }) => {
      const session = getSession();
      if (!session.accessToken) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You need to log in first. Use the `login` tool to sign in.",
            },
          ],
        };
      }

      await refreshSubscriptionStatus();
      if (!session.isSubscribed) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Game details with full prize breakdowns require a Savvy Scratch subscription ($5/mo or $50/yr). Use the `get_subscribe_link` tool to subscribe.",
            },
          ],
        };
      }

      const games = await fetchGames(state.toLowerCase(), session.accessToken);
      const match = games.find((g) =>
        g.game_name.toLowerCase().includes(game_name.toLowerCase())
      );

      if (!match) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No game matching "${game_name}" found in ${state.toLowerCase()}. Use \`get_games\` to see available games.`,
            },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: formatGameDetailed(match) },
        ],
      };
    }
  );

  // --- best_games ---
  server.tool(
    "best_games",
    "Find the best scratch-off games for a given budget and state. Shows top-rated games at or below your price point, ranked by weighted score. Free users see top 3; subscribers see all matches.",
    {
      state: z
        .string()
        .length(2)
        .describe("Two-letter state code (e.g., TX, FL, CA)"),
      budget: z
        .coerce.number()
        .positive()
        .describe(
          "Maximum price per ticket in dollars (e.g., 5 for $5 tickets and under)"
        ),
    },
    async ({ state, budget }) => {
      const session = getSession();
      if (!session.accessToken) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You need to log in first. Use the `login` tool to sign in, or `register` to create a free account.",
            },
          ],
        };
      }

      const allGames = await fetchGames(
        state.toLowerCase(),
        session.accessToken
      );
      const games = allGames
        .filter(
          (g) =>
            g.price_raw <= budget &&
            g.remaining_tickets > 0 &&
            (g.evaluation === GameEvaluation.Good ||
              g.evaluation === GameEvaluation.New)
        )
        .sort((a, b) => b.weighted_score - a.weighted_score);

      if (games.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No Good or New-rated games at $${budget} or under in ${state.toLowerCase()} right now. Try increasing your budget or check a different state.`,
            },
          ],
        };
      }

      await refreshSubscriptionStatus();
      const isSub = session.isSubscribed;
      const display = isSub ? games : games.slice(0, FREE_GAME_LIMIT);
      const lines = display.map(formatGameSummary);

      const footer = !isSub
        ? `\n\n🔒 Showing ${display.length} of ${games.length} matches. Subscribe ($5/mo) to see all results. Use \`get_subscribe_link\` to get started.`
        : "";

      return {
        content: [
          {
            type: "text" as const,
            text: `Best games in ${state.toLowerCase()} at $${budget} or under:\n\n${lines.join("\n\n")}${footer}`,
          },
        ],
      };
    }
  );
}
