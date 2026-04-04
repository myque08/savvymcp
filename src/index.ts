#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGameTools } from "./tools/games.js";
import { registerAuthTools } from "./tools/auth.js";

const server = new McpServer({
  name: "savvyscratch",
  version: "1.0.0",
  description:
    "Savvy Scratch — scratch-off lottery game analysis powered by pro gambler methodology. " +
    "Analyze games across 19 U.S. states, find the best odds, and make smarter plays.",
});

// Register all tool groups
registerAuthTools(server);
registerGameTools(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Savvy Scratch MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
