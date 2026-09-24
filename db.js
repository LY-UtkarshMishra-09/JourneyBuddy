/**
 * TravelMate Backend API Client (db.js)
 * Connects frontend → backend → database → backend → frontend
 * Minimal REST operations for Trips, Itinerary, Packing, and Budget
 */

const TravelMateDB = (() => {
  const API_BASE = '/api';

  async function request(endpoint, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`API call error on ${endpoint}:`, err);
      throw err;
    }
  }

  // --- Trips: Create, View, Edit, Delete ---
  async function getAllTrips() {
    return await request('/trips', { method: 'GET' });
  }

  async function getTrip(tripId) {
    return await request(`/trips/${encodeURIComponent(tripId)}`, { method: 'GET' });
  }

  async function saveTrip(trip) {
    // If trip exists, PUT to update; otherwise POST
    try {
      return await request(`/trips/${encodeURIComponent(trip.id)}`, {
        method: 'PUT',
        body: JSON.stringify(trip)
      });
    } catch {
      return await request('/trips', {
        method: 'POST',
        body: JSON.stringify(trip)
      });
    }
  }

  async function createTrip(trip) {
    return await request('/trips', {
      method: 'POST',
      body: JSON.stringify(trip)
    });
  }

  async function editTrip(tripId, updates) {
    return await request(`/trips/${encodeURIComponent(tripId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async function deleteTrip(tripId) {
    return await request(`/trips/${encodeURIComponent(tripId)}`, {
      method: 'DELETE'
    });
  }

  // --- Itinerary: Load & Save ---
  async function getItinerary(tripId) {
    return await request(`/trips/${encodeURIComponent(tripId)}/itinerary`, { method: 'GET' });
  }

  async function saveItinerary(tripId, itineraryData) {
    return await request(`/trips/${encodeURIComponent(tripId)}/itinerary`, {
      method: 'PUT',
      body: JSON.stringify(itineraryData)
    });
  }

  // --- Packing: Load & Save ---
  async function getPacking(tripId) {
    return await request(`/trips/${encodeURIComponent(tripId)}/packing`, { method: 'GET' });
  }

  async function savePacking(tripId, items) {
    return await request(`/trips/${encodeURIComponent(tripId)}/packing`, {
      method: 'PUT',
      body: JSON.stringify(items)
    });
  }

  // --- Budget: Load & Save ---
  async function getBudget(tripId) {
    return await request(`/trips/${encodeURIComponent(tripId)}/budget`, { method: 'GET' });
  }

  async function saveBudget(tripId, budgetData) {
    return await request(`/trips/${encodeURIComponent(tripId)}/budget`, {
      method: 'PUT',
      body: JSON.stringify(budgetData)
    });
  }

  return {
    getAllTrips,
    getTrip,
    createTrip,
    editTrip,
    deleteTrip,
    saveTrip,
    getItinerary,
    saveItinerary,
    getPacking,
    savePacking,
    getBudget,
    saveBudget
  };
})();
