const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

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

// Destination Cover Image Helper
function getRandomTripImage(dest) {
  const d = (dest || '').toLowerCase();
  if (d.includes('paris') || d.includes('france')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=80';
  } else if (d.includes('santorini') || d.includes('greece') || d.includes('beach')) {
    return 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=80';
  } else if (d.includes('bali') || d.includes('indonesia')) {
    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=80';
  }
  return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=700&q=80';
}

// --- Groq AI Trip Generator with Retry ---
async function callGroqWithRetry(preferences, retries = 2) {
  const apiKey = process.env.XAI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === '$$$$$') {
    throw new Error('XAI_API_KEY is not configured in .env. Please add your Groq API key in .env file.');
  }

  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const model = 'openai/gpt-oss-120b';

  const systemPrompt = `You are TravelMate AI, an expert travel planner specializing in cute, aesthetic, thoughtful journeys.
Generate a structured travel plan based strictly on the user's destination, dates, budget, travellers, travel styles, accommodation, and pace.
You must return ONLY a valid JSON object matching this schema exactly:
{
  "tripSummary": {
    "title": "Cute trip title with emoji",
    "hotel": "Boutique hotel / stay name with vibe",
    "tags": ["#Tag1", "#Tag2", "#Tag3"]
  },
  "days": [
    {
      "day": 1,
      "city": "City name",
      "hotel": "Hotel name",
      "morning": [
        { "id": "m1_1", "time": "09:00 AM", "title": "Activity title with emoji", "desc": "Cozy activity description", "cost": "$15", "tags": ["Food", "Morning"], "done": false }
      ],
      "afternoon": [
        { "id": "a1_1", "time": "01:30 PM", "title": "Activity title with emoji", "desc": "Detailed activity description", "cost": "$20", "tags": ["Sightseeing"], "done": false }
      ],
      "evening": [
        { "id": "e1_1", "time": "07:00 PM", "title": "Activity title with emoji", "desc": "Detailed activity description", "cost": "$30", "tags": ["Dinner"], "done": false }
      ]
    }
  ],
  "packing": [
    { "id": "p1", "cat": "clothes", "name": "Weather-appropriate clothing item with emoji", "done": false },
    { "id": "p2", "cat": "toiletries", "name": "Toiletry item with emoji", "done": false },
    { "id": "p3", "cat": "tech", "name": "Tech or gadget item with emoji", "done": false },
    { "id": "p4", "cat": "docs", "name": "Document or money item with emoji", "done": false }
  ],
  "budget": {
    "total": 2500,
    "currency": "$",
    "expenses": [
      { "id": "ex1", "name": "Stay booking", "cat": "Stay", "amount": 800 },
      { "id": "ex2", "name": "Food & Cafes", "cat": "Food", "amount": 450 },
      { "id": "ex3", "name": "Attractions & Entry", "cat": "Activities", "amount": 250 },
      { "id": "ex4", "name": "Local Transport", "cat": "Transport", "amount": 150 },
      { "id": "ex5", "name": "Souvenirs & Gifts", "cat": "Souvenirs", "amount": 150 }
    ]
  }
}
Generate one day entry for each day of the trip duration. Packing suggestions must consider seasonal destination weather.`;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a cute travel plan with these preferences: ${JSON.stringify(preferences)}` }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) throw new Error('No content received from Groq AI');

      return JSON.parse(content);
    } catch (err) {
      lastError = err;
      console.warn(`Groq attempt ${attempt + 1} failed:`, err.message);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
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

  // --- AI GENERATE TRIP ENDPOINT: POST /generate-trip or /api/generate-trip ---
  if (pathname === '/generate-trip' || pathname === '/api/generate-trip') {
    if (method !== 'POST') return sendJSON(res, 405, { error: 'Method Not Allowed' });
    try {
      const preferences = await parseBody(req);
      if (!preferences.destination) {
        return sendJSON(res, 400, { error: 'Destination is required' });
      }

      // Call Groq AI with retry
      const aiResult = await callGroqWithRetry(preferences);

      const diffDays = preferences.duration || (aiResult.days ? aiResult.days.length : 5);
      const newTripId = 'trip-' + Date.now();
      const currency = preferences.currency || (aiResult.budget && aiResult.budget.currency) || '$';
      const budgetNum = preferences.budget || (aiResult.budget && aiResult.budget.total) || 2000;

      const newTrip = {
        id: newTripId,
        destination: preferences.destination,
        title: (aiResult.tripSummary && aiResult.tripSummary.title) || `${preferences.destination} Journey 🌸`,
        dates: `${preferences.departure} to ${preferences.returnDate}`,
        duration: `${diffDays} Days`,
        status: 'upcoming',
        hotel: (aiResult.tripSummary && aiResult.tripSummary.hotel) || preferences.accommodation || 'Cute Boutique Stay',
        pace: preferences.pace || 'Balanced',
        budget: `${currency}${budgetNum.toLocaleString()}`,
        currency: currency,
        travellerType: preferences.travellerType || 'solo',
        travellerCount: preferences.travellerCount || 1,
        travelStyles: preferences.travelStyles || [],
        accommodation: preferences.accommodation || 'Boutique Hotel',
        image: getRandomTripImage(preferences.destination),
        tags: (aiResult.tripSummary && aiResult.tripSummary.tags) || ['#AIEnhanced', '#CuteTrip']
      };

      const itineraryMap = {};
      if (Array.isArray(aiResult.days)) {
        aiResult.days.forEach(d => {
          itineraryMap[d.day] = {
            city: d.city || preferences.destination,
            hotel: d.hotel || newTrip.hotel,
            morning: d.morning || [],
            afternoon: d.afternoon || [],
            evening: d.evening || []
          };
        });
      }

      const packingList = Array.isArray(aiResult.packing) && aiResult.packing.length > 0
        ? aiResult.packing
        : [];

      const budgetData = aiResult.budget || {
        total: budgetNum,
        currency: currency,
        expenses: []
      };

      // Save to existing database
      const db = readDB();
      if (!db.trips) db.trips = [];
      db.trips.unshift(newTrip);

      if (!db.itinerary) db.itinerary = {};
      db.itinerary[newTripId] = itineraryMap;

      if (!db.packing) db.packing = {};
      db.packing[newTripId] = packingList;

      if (!db.budget) db.budget = {};
      db.budget[newTripId] = budgetData;

      writeDB(db);

      return sendJSON(res, 200, {
        success: true,
        trip: newTrip,
        itinerary: itineraryMap,
        packing: packingList,
        budget: budgetData
      });
    } catch (err) {
      console.error('Error generating trip with Groq AI:', err);
      return sendJSON(res, 500, {
        error: err.message || 'Failed to generate trip with Groq AI'
      });
    }
  }

  // --- Existing CRUD API Routes ---
  if (pathname.startsWith('/api/')) {
    const db = readDB();

    // 1. TRIPS: GET, POST
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

    // 2. SPECIFIC TRIP: GET, PUT, DELETE
    const tripMatch = pathname.match(/^\/api\/trips\/([^\/]+)$/);
    if (tripMatch) {
      const tripId = tripMatch[1];
      const tripIndex = (db.trips || []).findIndex(t => t.id === tripId);

      if (method === 'GET') {
        if (tripIndex === -1) return sendJSON(res, 404, { error: 'Trip not found' });
        return sendJSON(res, 200, db.trips[tripIndex]);
      }

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

    // 3. ITINERARY: GET, PUT
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

    // 4. PACKING: GET, PUT
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

    // 5. BUDGET: GET, PUT
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
