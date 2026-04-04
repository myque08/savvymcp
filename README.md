# Savvy Scratch MCP Server

An MCP (Model Context Protocol) server that lets AI assistants access Savvy Scratch scratch-off lottery game analysis.

Users can register, log in, browse game data, and subscribe — all through natural language conversation with their AI.

## Tools

### Auth & Account
| Tool | Description |
|------|-------------|
| `register` | Create a new Savvy Scratch account |
| `login` | Sign in with email and password |
| `logout` | Sign out |
| `check_subscription` | View subscription status and plan details |
| `get_subscribe_link` | Get a Stripe checkout link to subscribe |

### Game Analysis
| Tool | Description | Free | Subscriber |
|------|-------------|------|------------|
| `list_states` | List all 19 covered states | Full | Full |
| `get_games` | Get scratch-off games for a state | Top 3 | All games |
| `game_details` | Detailed prize breakdown for a game | Locked | Full |
| `best_games` | Best games for a budget and state | Top 3 | All matches |

## Setup

### 1. Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SAVVYSCRATCH_DOMAIN=https://www.savvyscratch.com
```

### 2. Build

```bash
cd mcp-server
npm install
npm run build
```

### 3. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "savvyscratch": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "SUPABASE_ANON_KEY": "your-anon-key",
        "SAVVYSCRATCH_DOMAIN": "https://www.savvyscratch.com"
      }
    }
  }
}
```

### 4. Configure in Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "savvyscratch": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

## Example Conversation

```
User: What scratch-off games are available in Texas?
AI: [calls login, then get_games with state=TX]
    Shows top 3 games with scores and odds...
    "Subscribe to see all 47 games. Use get_subscribe_link for checkout."

User: I want to subscribe yearly
AI: [calls get_subscribe_link with plan=yearly]
    "Here's your checkout link: https://www.savvyscratch.com/subscribe"

User: OK I subscribed. What are the best $5 games in Florida?
AI: [calls best_games with state=FL, budget=5]
    Shows all matching games ranked by weighted score with full details
```

## Architecture

```
MCP Client (Claude Desktop / Claude Code)
    |
    | stdio (MCP protocol)
    |
MCP Server (this package)
    |
    |-- Supabase Auth (register/login/subscription check)
    |-- Supabase Edge Functions (game data)
    |-- Stripe (via web app redirect for checkout)
```

The server authenticates users through Supabase, checks subscription status from user metadata, and fetches game data from the same edge functions the web app uses. Subscription checkout redirects to the Savvy Scratch website where Stripe handles payment.
