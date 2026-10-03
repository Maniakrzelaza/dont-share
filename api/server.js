// Ranking wyzwania dnia. Bez zależności: node:http i pliki JSONL na wolumenie /data.
//
//   GET  /api/health                         -> { ok: true }
//   GET  /api/leaderboard?date=RRRR-MM-DD     -> { date, total, top: [{ rank, name, score, ok }] }
//   POST /api/scores { date, name, decisions } -> { rank, total, score, ok }
//
// Wynik liczy serwer (score.js). Przyjmowane są tylko daty bliskie dzisiejszej, jeden wpis na
// pseudonim dziennie i kilka zapisów dziennie z jednego adresu. Adres IP nie jest zapisywany —
// do limitu służy jego skrót z dziennym ziarnem, trzymany tylko w pamięci.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { scoreRun, Invalid } = require('./score.js');

const PORT = Number(process.env.PORT || 8080);
const DATA = process.env.DS_DATA_DIR || '/data/scores';
const TOP = 20;
const MAX_BODY = 8 * 1024;
const MAX_PER_ADDRESS = 8;

fs.mkdirSync(DATA, { recursive: true });

// Gracze są w różnych strefach czasowych, a serwer liczy w UTC: dzień „dzisiejszy” to każda data,
// która gdzieś na świecie właśnie trwa.
function openDates() {
  const now = Date.now(), h = 3600 * 1000;
  return new Set([-12, 0, 14].map(off => utcKey(new Date(now + off * h))));
}

function utcKey(d) {
  return d.toISOString().slice(0, 10);
}

const boards = new Map();

function board(date) {
  if (!boards.has(date)) {
    const file = path.join(DATA, `${date}.jsonl`);
    const rows = fs.existsSync(file)
      ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
      : [];
    boards.set(date, rows);
  }
  return boards.get(date);
}

const ranked = rows => rows.slice().sort((a, b) => b.score - a.score || a.at - b.at);

// Pseudonim: litery (także polskie), cyfry, spacja i kilka znaków. Prosta lista blokuje
// najczęstsze wulgaryzmy i obelgi — to gra szkolna, ranking widzą wszyscy.
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,18}[\p{L}\p{N}]$/u;
const BLOCKED = ['kurw', 'chuj', 'huj', 'pierdol', 'jeban', 'jebac', 'pizd', 'cipa', 'cwel', 'pedal', 'dziwk',
  'fuck', 'shit', 'cunt', 'nigg', 'fagg', 'whore', 'hitler', 'nazi', 'heil', 'rape', 'gwalt', 'zydz', 'zydy'];
const fold = s => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().replace(/[^a-z0-9]/g, '');

function validName(raw) {
  const name = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!NAME_RE.test(name)) return null;
  const f = fold(name);
  return BLOCKED.some(b => f.includes(b)) ? null : name;
}

const attempts = new Map();
function allowed(req, date) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const key = crypto.createHash('sha256').update(date + ':' + ip).digest('hex');
  const n = (attempts.get(key) || 0) + 1;
  attempts.set(key, n);
  if (attempts.size > 50000) attempts.clear();
  return n <= MAX_PER_ADDRESS;
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Invalid('body too large')); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(new Invalid('json')); }
    });
    req.on('error', reject);
  });
}

function leaderboard(date) {
  const rows = ranked(board(date));
  return { date, total: rows.length, top: rows.slice(0, TOP).map((r, i) => ({ rank: i + 1, name: r.name, score: r.score, ok: r.ok })) };
}

async function submit(req, res) {
  const body = await readBody(req);
  const date = String(body.date || '');
  if (!openDates().has(date)) return send(res, 400, { error: 'date' });
  const name = validName(body.name);
  if (!name) return send(res, 400, { error: 'name_invalid' });
  if (!allowed(req, date)) return send(res, 429, { error: 'rate' });
  const rows = board(date);
  if (rows.some(r => r.name.toLowerCase() === name.toLowerCase())) return send(res, 409, { error: 'name_taken' });
  const { score, ok } = scoreRun(date, body.decisions);
  const row = { name, score, ok, at: Date.now() };
  rows.push(row);
  fs.appendFileSync(path.join(DATA, `${date}.jsonl`), JSON.stringify(row) + '\n');
  const rank = ranked(rows).indexOf(row) + 1;
  send(res, 201, { rank, total: rows.length, score, ok });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
      const date = url.searchParams.get('date') || utcKey(new Date());
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: 'date' });
      return send(res, 200, leaderboard(date));
    }
    if (req.method === 'POST' && url.pathname === '/api/scores') return await submit(req, res);
    send(res, 404, { error: 'not_found' });
  } catch (e) {
    if (e instanceof Invalid) return send(res, 400, { error: 'invalid', detail: e.message });
    console.error(e);
    send(res, 500, { error: 'server' });
  }
});

server.listen(PORT, () => console.log(`leaderboard on :${PORT}, data in ${DATA}`));

