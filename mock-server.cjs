// ============================================================================
// SIM-CPL — server HTTP untuk mock API (data contoh), agar frontend bisa
// dijalankan tanpa backend Go. Data dan perhitungan ada di mock/api.mjs.
//
// Jalankan: node mock-server.cjs   →  http://localhost:8001/api
// ============================================================================
const http = require("http");

const PORT = Number(process.env.MOCK_PORT || 8001);

function send(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve(null); }
    });
  });
}

import("./mock/api.mjs").then((api) => {
  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") return send(res, 204, {});
    const body = req.method === "POST" ? await readBody(req) : undefined;
    const { status, data } = api.handle(req.method, req.url, body);
    send(res, status, data);
  });

  server.listen(PORT, () => {
    console.log(`SIM-CPL mock API → http://localhost:${PORT}/api  (${api.summary()})`);
  });
});
