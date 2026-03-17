// @ts-check
// Custom Next.js server that attaches a WebSocket server to the same HTTP port.
// Run this with: node server.mjs (or via `npm run dev:ws`)

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const { WebSocketServer } = require("ws");

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling request", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // ── WebSocket server on the same HTTP server ──────────────────────────────
  // We re-use the singleton from lib/ws-server  but here we pass the httpServer
  // so we can attach to the upgrade event manually (avoids port conflicts).
  const clients = new Map(); // ws => { userId, name, role, connectedAt, lastPing }

  const wss = new WebSocketServer({ noServer: true });

  // Expose globally so API routes can broadcast
  global.__ndnWss = wss;
  global.__ndnWsClients = clients;

  function broadcastActiveUsers() {
    const users = [];
    clients.forEach((info) => users.push({ ...info }));
    const msg = JSON.stringify({
      type: "active_users",
      payload: { users },
      timestamp: new Date().toISOString(),
    });
    clients.forEach((info, ws) => {
      if ((info.role === "super_admin" || info.role === "admin") && ws.readyState === 1) {
        ws.send(msg);
      }
    });
  }

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "/", "http://localhost");
    const userId = Number(url.searchParams.get("userId") || 0);
    const name = decodeURIComponent(url.searchParams.get("name") || "Unknown");
    const role = decodeURIComponent(url.searchParams.get("role") || "user");
    const now = new Date().toISOString();

    clients.set(ws, { userId, name, role, connectedAt: now, lastPing: now });

    ws.send(JSON.stringify({
      type: "connected",
      payload: { userId, message: "Connected to NDN realtime" },
      timestamp: now,
    }));

    broadcastActiveUsers();

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(String(raw));
        if (data.type === "ping") {
          const info = clients.get(ws);
          if (info) info.lastPing = new Date().toISOString();
          ws.send(JSON.stringify({ type: "pong", payload: {}, timestamp: new Date().toISOString() }));
        }
      } catch { /* ignore */ }
    });

    ws.on("close", () => { clients.delete(ws); broadcastActiveUsers(); });
    ws.on("error", () => { clients.delete(ws); });
  });

  // Handle HTTP Upgrade for WebSocket
  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url || "/");
    if (pathname === "/api/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  httpServer.listen(port, () => {
    console.log(`\n> NDN Dashboard ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server running on ws://${hostname}:${port}/api/ws`);
  });
});
