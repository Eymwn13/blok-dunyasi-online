const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = process.env.DATA_DIR || __dirname;
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
const SAVE_FILE = path.join(DATA_DIR, "worlds.json");
const rooms = new Map();

try {
  const saved = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8"));
  for (const [code, room] of Object.entries(saved)) rooms.set(code, room);
} catch (_) {}

function persist() {
  const data = {};
  for (const [code, room] of rooms) data[code] = { world: room.world || [], mode: room.mode || "survival" };
  fs.writeFile(SAVE_FILE, JSON.stringify(data), err => {
    if (err) console.error("Dünya kaydedilemedi:", err.message);
  });
}
function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function broadcast(room, data, except) {
  for (const client of room.clients) if (client !== except) send(client, data);
}
function safeText(value, max = 180) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
  }
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  const file = requested === "/" || requested === "/index.html" || requested === "/blok_dunyasi_3d.html"
    ? path.join(__dirname, "blok_dunyasi_3d.html") : null;
  if (!file) { res.writeHead(404); return res.end("Not found"); }
  fs.readFile(file, (err, content) => {
    if (err) { res.writeHead(500); return res.end("Oyun dosyası okunamadı."); }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(content);
  });
});
const wss = new WebSocket.Server({ server, maxPayload: 8 * 1024 * 1024 });
let nextId = 1;

wss.on("connection", ws => {
  ws.id = "p" + nextId++;
  ws.roomCode = null;
  ws.playerName = "Oyuncu";
  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (_) { return; }

    if (msg.type === "join") {
      const code = safeText(msg.room, 16).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      if (!code) return send(ws, { type: "error", message: "Oda kodu geçersiz." });
      let room = rooms.get(code);
      const isNew = !room;
      if (!room) {
        room = { clients: new Set(), world: Array.isArray(msg.world) ? msg.world.slice(0, 30000) : [], mode: msg.mode === "creative" ? "creative" : "survival" };
        rooms.set(code, room);
      }
      ws.roomCode = code;
      ws.playerName = safeText(msg.name, 16) || "Oyuncu";
      ws.player = { id: ws.id, name: ws.playerName, x: 0, y: 4, z: 0, yaw: 0 };
      const existing = [...room.clients].map(c => c.player).filter(Boolean);
      room.clients.add(ws);
      send(ws, { type: "welcome", id: ws.id, mode: room.mode, players: existing });
      if (!isNew && room.world.length) send(ws, { type: "world", blocks: room.world });
      broadcast(room, { type: "playerJoin", player: ws.player }, ws);
      persist();
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) return;
    if (msg.type === "move" && msg.player) {
      const p = msg.player;
      ws.player = {
        id: ws.id, name: ws.playerName,
        x: Number(p.x) || 0, y: Number(p.y) || 0, z: Number(p.z) || 0,
        yaw: Number(p.yaw) || 0
      };
      broadcast(room, { type: "playerMove", id: ws.id, player: ws.player }, ws);
    } else if (msg.type === "blockAdd" && msg.block) {
      const b = msg.block, x = Math.round(Number(b.x)), y = Math.round(Number(b.y)), z = Math.round(Number(b.z));
      const type = safeText(b.type, 20);
      if (![x,y,z].every(Number.isFinite) || Math.abs(x)>256 || Math.abs(y)>128 || Math.abs(z)>256 || !/^(grass|dirt|stone|wood|sand|brick|leaves)$/.test(type)) return;
      const idx = room.world.findIndex(v => v.x===x && v.y===y && v.z===z);
      if (idx < 0) room.world.push({ x,y,z,type });
      broadcast(room, { type: "blockAdd", block: { x,y,z,type } }, ws);
      persist();
    } else if (msg.type === "blockRemove" && msg.pos) {
      const x=Math.round(Number(msg.pos.x)),y=Math.round(Number(msg.pos.y)),z=Math.round(Number(msg.pos.z));
      room.world = room.world.filter(v => !(v.x===x && v.y===y && v.z===z));
      broadcast(room, { type: "blockRemove", pos: {x,y,z} }, ws);
      persist();
    } else if (msg.type === "chat") {
      const text = safeText(msg.text, 180);
      if (text) broadcast(room, { type: "chat", name: ws.playerName, text }, null);
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    room.clients.delete(ws);
    broadcast(room, { type: "playerLeave", id: ws.id }, null);
    if (room.clients.size === 0) persist();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\\n=== BLOK DÜNYASI ONLINE ===");
  console.log("Sunucu portu:", PORT);
  console.log("Bu tablette: ws://127.0.0.1:" + PORT);
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) for (const n of (list || [])) {
    if (n.family === "IPv4" && !n.internal) console.log("Aynı Wi-Fi'deki arkadaşlar: ws://" + n.address + ":" + PORT);
  }
  console.log("Sağlık kontrolü: http://127.0.0.1:" + PORT + "/health\\n");
});
