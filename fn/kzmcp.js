// MCP-server van de keuzehulpen voor de AI-assistent van de bezoeker (19 nov 2026). Routes (vercel.json): /mcp op keuzehulp.best, whichtobuy.best,
// kaufberater.best (en de vercel.app-host met ?m=), /koppel, /connect, /verbinden en /.well-known/mcp.json. Werking: lib/kzmcp.js.
import { mcpHandler } from '../lib/kzmcp.js';
export default async function handler(req, res) { return mcpHandler(req, res); }
