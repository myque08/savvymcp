# Savvy Scratch MCP Server

[![npm version](https://img.shields.io/npm/v/@savvyscratch/mcp-server)](https://www.npmjs.com/package/@savvyscratch/mcp-server)

## Install

### Claude Desktop

Open your `claude_desktop_config.json`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the Savvy Scratch server:

```json
{
  "mcpServers": {
    "savvyscratch": {
      "command": "npx",
      "args": ["-y", "@savvyscratch/mcp-server"]
    }
  }
}
```

Restart Claude Desktop. You're done.

### Claude Code

Add to your project's `.mcp.json` (or run `claude mcp add`):

```json
{
  "mcpServers": {
    "savvyscratch": {
      "command": "npx",
      "args": ["-y", "@savvyscratch/mcp-server"]
    }
  }
}
```

### Other MCP-compatible clients

Any client that supports stdio MCP servers can run:

```bash
npx -y @savvyscratch/mcp-server
```

## What is this?

An MCP (Model Context Protocol) server that gives AI assistants access to [Savvy Scratch](https://www.savvyscratch.com) — pro-gambler-grade analysis of scratch-off lottery games across 19 U.S. states.

Register, sign in, browse live game data, and subscribe — all through natural conversation with your AI. **Zero configuration required.**

## First-time setup (through your AI)

Once installed, just talk to your AI:

1. **"Register a Savvy Scratch account for me"** → AI uses the `register` tool
2. **"What scratch-off games should I play in Florida?"** → AI uses `login` + `get_games`
3. **"Subscribe me to Savvy Scratch"** → AI uses `get_subscribe_link`

No API keys. No env vars. Your account lives in your AI session.

## Tools

### Auth & Account
| Tool | Description |
|------|-------------|
| `register` | Create a new Savvy Scratch account |
| `login` | Sign in with email and password |
| `logout` | Sign out |
| `check_subscription` | View subscription status and plan details |
| `get_subscribe_link` | Get a link to subscribe |

### Game Analysis
| Tool | Description | Free | Subscriber |
|------|-------------|------|------------|
| `list_states` | List all 19 covered states | Full | Full |
| `get_games` | Get scratch-off games for a state | Top 3 | All games |
| `game_details` | Detailed prize breakdown for a game | Locked | Full |
| `best_games` | Best games for a budget and state | Top 3 | All matches |

## Pricing

Free accounts see top-3 previews in every state. A Savvy Scratch subscription ($5/mo or $50/yr) unlocks:

- All games in all 19 states
- Detailed prize-tier breakdowns with live remaining prizes
- Budget-optimized recommendations ranked by weighted score
- Pro gambler methodology applied to every game

## Example Conversation

```
You: What scratch-off games should I play in Florida?

AI: [calls login, then get_games with state=fl]
    Shows top 3 games with scores and odds...
    "Subscribe to see all 100 games. Use get_subscribe_link to get started."

You: I have $10 to spend in Georgia, what's best?

AI: [calls best_games with state=ga, budget=10]
    Shows top-rated games at $10 or under ranked by weighted score

You: Show me the prize breakdown for Atlanta Falcons

AI: [calls game_details with state=ga, game_name="Atlanta Falcons"]
    Full prize tier breakdown with remaining prizes and adjusted odds
```

## Build from source

```bash
git clone https://github.com/myque08/savvymcp.git
cd savvymcp
npm install
npm run build
node dist/index.js
```

## Links

- **npm package:** https://www.npmjs.com/package/@savvyscratch/mcp-server
- **Website:** https://www.savvyscratch.com
- **GitHub:** https://github.com/myque08/savvymcp
- **Report issues:** https://github.com/myque08/savvymcp/issues
