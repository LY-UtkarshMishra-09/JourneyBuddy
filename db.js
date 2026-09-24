/**
 * TravelMate Minimal Persistent Database (IndexedDB)
 * Stores essential data:
 * - trips: destination, dates, budget, travellers, preferences
 * - itinerary: trip ID, day, city, hotel, activities
 * - packing: trip ID, items
 * - budget: trip ID, categories, amounts
 */

const TravelMateDB = (() => {
  const DB_NAME = 'TravelMateDB';
  const DB_VERSION = 1;
  let dbInstance = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        return resolve(dbInstance);
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Trips store
        if (!db.objectStoreNames.contains('trips')) {
          db.createObjectStore('trips', { keyPath: 'id' });
        }

        // 2. Itinerary store (key: tripId_day)
        if (!db.objectStoreNames.contains('itinerary')) {
          const itStore = db.createObjectStore('itinerary', { keyPath: 'id' });
          itStore.createIndex('tripId', 'tripId', { unique: false });
        }

        // 3. Packing store (key: tripId)
        if (!db.objectStoreNames.contains('packing')) {
          db.createObjectStore('packing', { keyPath: 'tripId' });
        }

        // 4. Budget store (key: tripId)
        if (!db.objectStoreNames.contains('budget')) {
          db.createObjectStore('budget', { keyPath: 'tripId' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        reject('IndexedDB Error: ' + event.target.errorCode);
      };
    });
  }

  function getStore(storeName, mode = 'readonly') {
    return openDB().then(db => {
      const tx = db.transaction(storeName, mode);
      return tx.objectStore(storeName);
    });
  }

  // --- Trips ---
  async function getAllTrips() {
    const store = await getStore('trips', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveTrip(trip) {
    const store = await getStore('trips', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(trip);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Itinerary ---
  async function getTripItineraries(tripId) {
    const store = await getStore('itinerary', 'readonly');
    return new Promise((resolve, reject) => {
      const index = store.index('tripId');
      const req = index.getAll(tripId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveItineraryDay(tripId, day, data) {
    const store = await getStore('itinerary', 'readwrite');
    const record = {
      id: `${tripId}_day_${day}`,
      tripId,
      day: parseInt(day),
      city: data.city,
      hotel: data.hotel,
      morning: data.morning || [],
      afternoon: data.afternoon || [],
      evening: data.evening || []
    };
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Packing ---
  async function getPacking(tripId) {
    const store = await getStore('packing', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(tripId);
      req.onsuccess = () => resolve(req.result ? req.result.items : null);
      req.onerror = () => reject(req.error);
    });
  }

  async function savePacking(tripId, items) {
    const store = await getStore('packing', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ tripId, items });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Budget ---
  async function getBudget(tripId) {
    const store = await getStore('budget', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(tripId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveBudget(tripId, budgetData) {
    const store = await getStore('budget', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ tripId, ...budgetData });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  return {
    openDB,
    getAllTrips,
    saveTrip,
    getTripItineraries,
    saveItineraryDay,
    getPacking,
    savePacking,
    getBudget,
    saveBudget
  };
})();
