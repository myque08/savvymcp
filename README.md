# Savvy Scratch MCP Server

An MCP (Model Context Protocol) server that lets AI assistants access Savvy Scratch scratch-off lottery game analysis.

Register, log in, browse game data, and subscribe — all through natural conversation with your AI.

**Zero configuration required.** Just install and go.

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

## Install

### Claude Desktop

Add to your `claude_desktop_config.json`:

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

### Claude Code

Add to your `.mcp.json`:

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

### Build from source

```bash
git clone https://github.com/myque08/savvymcp.git
cd savvymcp
npm install
npm run build
node dist/index.js
```

## Example Conversation

```
User: What scratch-off games should I play in Florida?

AI: [calls login, then get_games with state=fl]
    Shows top 3 games with scores and odds...
    "Subscribe to see all 100 games. Use get_subscribe_link to get started."

User: I have $10 to spend in Georgia, what's best?

AI: [calls best_games with state=ga, budget=10]
    Shows top-rated games at $10 or under ranked by weighted score

User: Show me the prize breakdown for Atlanta Falcons

AI: [calls game_details with state=ga, game_name="Atlanta Falcons"]
    Full prize tier breakdown with remaining prizes and adjusted odds
```
