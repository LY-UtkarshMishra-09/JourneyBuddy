const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// --- Database Helpers ---
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { trips: [], itinerary: {}, packing: {}, budget: {} };
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database.json:', err);
    return { trips: [], itinerary: {}, packing: {}, budget: {} };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database.json:', err);
    return false;
  }
}

// Request Body Parser Helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Send JSON Response Helper
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Static File Server Helper
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Server Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    const db = readDB();

    // 1. TRIPS COLLECTION: GET /api/trips, POST /api/trips
    if (pathname === '/api/trips') {
      if (method === 'GET') {
        return sendJSON(res, 200, db.trips || []);
      }
      if (method === 'POST') {
        try {
          const newTrip = await parseBody(req);
          if (!newTrip.id) newTrip.id = 'trip-' + Date.now();
          if (!db.trips) db.trips = [];
          db.trips.unshift(newTrip);
          writeDB(db);
          return sendJSON(res, 201, newTrip);
        } catch (err) {
          return sendJSON(res, 400, { error: 'Invalid JSON body' });
        }
      }
    }

    // 2. SPECIFIC TRIP ROUTES: /api/trips/:id ...
    const tripMatch = pathname.match(/^\/api\/trips\/([^\/]+)$/);
    if (tripMatch) {
      const tripId = tripMatch[1];
      const tripIndex = (db.trips || []).findIndex(t => t.id === tripId);

      // GET /api/trips/:id
      if (method === 'GET') {
        if (tripIndex === -1) return sendJSON(res, 404, { error: 'Trip not found' });
        return sendJSON(res, 200, db.trips[tripIndex]);
      }

      // PUT /api/trips/:id (Edit trip)
      if (method === 'PUT') {
        try {
          const updates = await parseBody(req);
          if (tripIndex === -1) return sendJSON(res, 404, { error: 'Trip not found' });
          db.trips[tripIndex] = { ...db.trips[tripIndex], ...updates };
          writeDB(db);
          return sendJSON(res, 200, db.trips[tripIndex]);
        } catch (err) {
          return sendJSON(res, 400, { error: 'Invalid JSON body' });
        }
      }

      // DELETE /api/trips/:id (Delete trip)
      if (method === 'DELETE') {
        if (tripIndex === -1) return sendJSON(res, 404, { error: 'Trip not found' });
        db.trips.splice(tripIndex, 1);
        if (db.itinerary && db.itinerary[tripId]) delete db.itinerary[tripId];
        if (db.packing && db.packing[tripId]) delete db.packing[tripId];
        if (db.budget && db.budget[tripId]) delete db.budget[tripId];
        writeDB(db);
        return sendJSON(res, 200, { success: true, deletedId: tripId });
      }
    }

    // 3. ITINERARY: /api/trips/:id/itinerary
    const itinMatch = pathname.match(/^\/api\/trips\/([^\/]+)\/itinerary$/);
    if (itinMatch) {
      const tripId = itinMatch[1];
      if (method === 'GET') {
        const itin = (db.itinerary && db.itinerary[tripId]) || {};
        return sendJSON(res, 200, itin);
      }
      if (method === 'PUT') {
        try {
          const itineraryData = await parseBody(req);
          if (!db.itinerary) db.itinerary = {};
          db.itinerary[tripId] = itineraryData;
          writeDB(db);
          return sendJSON(res, 200, db.itinerary[tripId]);
        } catch (err) {
          return sendJSON(res, 400, { error: 'Invalid JSON body' });
        }
      }
    }

    // 4. PACKING: /api/trips/:id/packing
    const packingMatch = pathname.match(/^\/api\/trips\/([^\/]+)\/packing$/);
    if (packingMatch) {
      const tripId = packingMatch[1];
      if (method === 'GET') {
        const packing = (db.packing && db.packing[tripId]) || [];
        return sendJSON(res, 200, packing);
      }
      if (method === 'PUT') {
        try {
          const items = await parseBody(req);
          if (!db.packing) db.packing = {};
          db.packing[tripId] = items;
          writeDB(db);
          return sendJSON(res, 200, db.packing[tripId]);
        } catch (err) {
          return sendJSON(res, 400, { error: 'Invalid JSON body' });
        }
      }
    }

    // 5. BUDGET: /api/trips/:id/budget
    const budgetMatch = pathname.match(/^\/api\/trips\/([^\/]+)\/budget$/);
    if (budgetMatch) {
      const tripId = budgetMatch[1];
      if (method === 'GET') {
        const budget = (db.budget && db.budget[tripId]) || null;
        return sendJSON(res, 200, budget);
      }
      if (method === 'PUT') {
        try {
          const budgetData = await parseBody(req);
          if (!db.budget) db.budget = {};
          db.budget[tripId] = budgetData;
          writeDB(db);
          return sendJSON(res, 200, db.budget[tripId]);
        } catch (err) {
          return sendJSON(res, 400, { error: 'Invalid JSON body' });
        }
      }
    }

    return sendJSON(res, 404, { error: 'API route not found' });
  }

  // Otherwise serve static frontend files
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`TravelMate backend listening on http://localhost:${PORT}`);
});
