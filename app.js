/**
 * JourneyBuddy - Cute Pastel Scrapbook Travel Planner
 * Functional Vanilla JS connected to Minimal Backend (server.js), Database (database.json), & Groq AI
 */

// ==========================================
// STATE & SEED DATA
// ==========================================

const state = {
  activeView: 'home',
  editingTripId: null,
  currentTrip: {
    id: 'trip-kyoto',
    destination: 'Kyoto, Japan',
    departure: '2026-04-10',
    returnDate: '2026-04-14',
    duration: 5,
    budget: 2500,
    currency: '$',
    travellerType: 'solo',
    travellerCount: 1,
    travelStyles: ['Cultural & Historic', 'Foodie Trail'],
    accommodation: 'Cozy Airbnb / Ryokan',
    hotelName: 'Ryokan Gion Sano (Tatami & Garden View)',
    pace: 'Balanced',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=700&q=80'
  },
  trips: [],
  itineraryDays: {},
  packingItems: [],
  budget: {
    total: 2500,
    currency: '$',
    expenses: []
  },
  currentDayTab: 1
};

// ==========================================
// DOM & BACKEND DATABASE INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupPlanTripForm();
  setupMobileMenu();
  setupThemeToggle();

  // Load persistent trips from backend database
  await initializePersistentData();
});

async function initializePersistentData() {
  try {
    const storedTrips = await JourneyBuddyDB.getAllTrips();

    if (storedTrips && storedTrips.length > 0) {
      state.trips = storedTrips;
      const initialTrip = storedTrips[0];
      await loadTripDataFromDB(initialTrip.id, false);
    }
  } catch (err) {
    console.warn('Backend sync warning, loading fallback:', err);
  }

  renderItineraryDay(state.currentDayTab);
  renderPackingList();
  renderBudget();
  renderMyTrips();
}

async function loadTripDataFromDB(tripId, switchView = true) {
  try {
    const trip = state.trips.find(t => t.id === tripId) || await JourneyBuddyDB.getTrip(tripId);
    if (!trip) return;

    state.currentTrip = {
      id: trip.id,
      destination: trip.destination,
      departure: trip.dates ? trip.dates.split(' to ')[0] : '2026-04-10',
      returnDate: trip.dates ? trip.dates.split(' to ')[1] : '2026-04-14',
      duration: parseInt(trip.duration) || 5,
      budget: parseFloat(String(trip.budget).replace(/[^0-9.]/g, '')) || 2500,
      currency: trip.currency || '$',
      travellerType: trip.travellerType || 'solo',
      travellerCount: trip.travellerCount || 1,
      travelStyles: trip.travelStyles || [],
      accommodation: trip.accommodation || 'Boutique Hotel',
      hotelName: trip.hotel || 'Cozy Stay',
      pace: trip.pace || 'Balanced',
      status: trip.status || 'upcoming',
      image: trip.image
    };

    // Load Itinerary from backend
    try {
      const itin = await JourneyBuddyDB.getItinerary(tripId);
      if (itin && Object.keys(itin).length > 0) {
        state.itineraryDays = itin;
      } else {
        state.itineraryDays = generateDefaultItinerary(trip.destination, state.currentTrip.hotelName, state.currentTrip.duration, state.currentTrip.currency);
      }
    } catch {
      state.itineraryDays = generateDefaultItinerary(trip.destination, state.currentTrip.hotelName, state.currentTrip.duration, state.currentTrip.currency);
    }

    // Load Packing from backend
    try {
      const packing = await JourneyBuddyDB.getPacking(tripId);
      if (packing && packing.length > 0) {
        state.packingItems = packing;
      } else {
        state.packingItems = generateDefaultPacking();
      }
    } catch {
      state.packingItems = generateDefaultPacking();
    }

    // Load Budget from backend
    try {
      const bgt = await JourneyBuddyDB.getBudget(tripId);
      if (bgt && bgt.total) {
        state.budget = bgt;
      } else {
        state.budget = {
          total: state.currentTrip.budget,
          currency: state.currentTrip.currency,
          expenses: [
            { id: 'ex_init', name: `${trip.destination.split(',')[0]} Accommodation`, cat: 'Stay', amount: Math.round(state.currentTrip.budget * 0.4) }
          ]
        };
      }
    } catch {
      state.budget = {
        total: state.currentTrip.budget,
        currency: state.currentTrip.currency,
        expenses: []
      };
    }

    // Update UI Elements
    document.getElementById('itineraryTitle').textContent = trip.title || `${trip.destination} Journey`;
    document.getElementById('itineraryDates').textContent = `📅 ${trip.dates} (${trip.duration})`;
    document.getElementById('itineraryPace').textContent = `🚶 ${trip.pace || 'Balanced'}`;
    document.getElementById('itineraryParty').textContent = `👥 ${trip.travellerCount || 1} Traveller(s)`;
    document.getElementById('currentCityLabel').textContent = trip.destination;
    document.getElementById('currentHotelLabel').textContent = trip.hotel || state.currentTrip.hotelName;

    renderItineraryTabs();
    renderItineraryDay(1);
    renderPackingList();
    renderBudget();

    if (switchView) {
      navigateTo('itinerary');
      showToast(`🌸 Loaded ${trip.destination} into your scrapbook!`);
    }
  } catch (err) {
    console.error('Error loading trip from backend:', err);
  }
}

function generateDefaultItinerary(dest, hotel, days = 5, currency = '$') {
  const itin = {};
  for (let i = 1; i <= days; i++) {
    itin[i] = {
      city: dest,
      hotel: hotel,
      morning: [
        { id: `m_${i}_1`, time: '09:00 AM', title: `Morning Bakery & Neighborhood Stroll 🥐`, desc: `Start Day ${i} at a local bakery in ${dest.split(',')[0]}.`, cost: `${currency}12`, tags: ['Food', 'Morning'], done: false }
      ],
      afternoon: [
        { id: `a_${i}_1`, time: '01:30 PM', title: `Landmarks & Historic Discovery 🏛️`, desc: 'Explore cultural sights and scenic photo spots.', cost: `${currency}18`, tags: ['Sightseeing'], done: false }
      ],
      evening: [
        { id: `e_${i}_1`, time: '07:00 PM', title: `Sunset Walk & Traditional Dinner 🌙`, desc: 'Enjoy delicious local dinner and write in your travel journal.', cost: `${currency}28`, tags: ['Dinner'], done: false }
      ]
    };
  }
  return itin;
}

function generateDefaultPacking() {
  return [
    { id: 'p1', cat: 'clothes', name: 'Comfortable walking sneakers 👟', done: true },
    { id: 'p2', cat: 'clothes', name: 'Pastel cardigan & travel outfits 🧥', done: true },
    { id: 'p3', cat: 'toiletries', name: 'Moisturizing sunscreen SPF50 🧴', done: true },
    { id: 'p4', cat: 'toiletries', name: 'Travel-size shampoo & mist 🌸', done: false },
    { id: 'p5', cat: 'tech', name: 'Power bank & charging cables 🔋', done: true },
    { id: 'p6', cat: 'tech', name: 'Plug adapter & camera 📸', done: false },
    { id: 'p7', cat: 'docs', name: 'Passport & Travel Insurance 🛂', done: true },
    { id: 'p8', cat: 'docs', name: 'Cash currency & cards 💴', done: false }
  ];
}

// ==========================================
// NAVIGATION & VIEW SWITCHING
// ==========================================

function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      navigateTo(target);
    });
  });
}

function navigateTo(targetView) {
  state.activeView = targetView;

  const views = document.querySelectorAll('.view-section');
  views.forEach(view => {
    view.classList.remove('active');
  });

  const activeElem = document.getElementById(`view-${targetView}`);
  if (activeElem) {
    activeElem.classList.add('active');
  }

  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    if (btn.getAttribute('data-target') === targetView) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const navMenu = document.getElementById('navMenu');
  if (navMenu) navMenu.classList.remove('show');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  
  // Default to dark theme as requested, or load stored preference
  const savedTheme = localStorage.getItem('jb_theme') || 'dark';
  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-theme');
      const nextTheme = isDark ? 'light' : 'dark';
      applyTheme(nextTheme);
      showToast(nextTheme === 'dark' ? '🌙 Dark scrapbook theme activated!' : '☀️ Light scrapbook theme activated!');
    });
  }
}

function applyTheme(theme) {
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeText) themeText.textContent = 'Dark';
  } else {
    document.body.classList.remove('dark-theme');
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeText) themeText.textContent = 'Light';
  }
  localStorage.setItem('jb_theme', theme);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3200);
}

// ==========================================
// SECTION 2: PLAN / EDIT TRIP FORM (GROQ AI INTEGRATED)
// ==========================================

function setupPlanTripForm() {
  const depInput = document.getElementById('departureDate');
  const retInput = document.getElementById('returnDate');
  const durationBadge = document.getElementById('durationBadge');

  const today = new Date();
  const depDate = new Date(today);
  depDate.setDate(today.getDate() + 14);
  const retDate = new Date(depDate);
  retDate.setDate(depDate.getDate() + 5);

  const formatDate = d => d.toISOString().split('T')[0];
  if (depInput && retInput) {
    depInput.value = formatDate(depDate);
    retInput.value = formatDate(retDate);

    const updateDuration = () => {
      if (depInput.value && retInput.value) {
        const start = new Date(depInput.value);
        const end = new Date(retInput.value);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          durationBadge.textContent = `⏳ Trip Duration: ${diffDays} Days (Calculated)`;
        } else {
          durationBadge.textContent = `⚠️ Return date must be after departure!`;
        }
      }
    };

    depInput.addEventListener('change', updateDuration);
    retInput.addEventListener('change', updateDuration);
  }

  const travellerChips = document.querySelectorAll('#travellerTypeGroup .select-chip');
  const countInput = document.getElementById('travellerCountInput');

  travellerChips.forEach(chip => {
    chip.addEventListener('click', () => {
      travellerChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const type = chip.getAttribute('data-traveller');
      if (type === 'solo') countInput.value = 1;
      else if (type === 'couple') countInput.value = 2;
      else if (type === 'family') countInput.value = 4;
      else if (type === 'friends') countInput.value = 3;
    });
  });
}

function adjustCount(change) {
  const input = document.getElementById('travellerCountInput');
  let val = parseInt(input.value) || 1;
  val = Math.max(1, Math.min(25, val + change));
  input.value = val;
}

function startEditTrip(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;

  state.editingTripId = tripId;
  navigateTo('plan');

  document.getElementById('destinationInput').value = trip.destination || '';
  if (trip.dates && trip.dates.includes(' to ')) {
    const [dep, ret] = trip.dates.split(' to ');
    document.getElementById('departureDate').value = dep;
    document.getElementById('returnDate').value = ret;
  }
  if (trip.currency) document.getElementById('currencySelect').value = trip.currency;
  if (trip.budget) {
    const rawBudget = parseFloat(String(trip.budget).replace(/[^0-9.]/g, '')) || 2000;
    document.getElementById('budgetInput').value = rawBudget;
  }
  if (trip.accommodation) document.getElementById('accommodationSelect').value = trip.accommodation;
  if (trip.pace) document.getElementById('paceSelect').value = trip.pace;

  const submitBtnSpan = document.querySelector('#planTripForm button[type="submit"] span');
  if (submitBtnSpan) submitBtnSpan.textContent = 'Update Trip in Database';

  showToast(`✏️ Editing ${trip.destination}! Update and submit to save.`);
}

async function handleTripSubmit(e) {
  e.preventDefault();
  const dest = document.getElementById('destinationInput').value.trim();
  const dep = document.getElementById('departureDate').value;
  const ret = document.getElementById('returnDate').value;
  const currency = document.getElementById('currencySelect').value;
  const budget = parseFloat(document.getElementById('budgetInput').value) || 2000;
  const activeTravellerChip = document.querySelector('#travellerTypeGroup .select-chip.active');
  const travellerType = activeTravellerChip ? activeTravellerChip.getAttribute('data-traveller') : 'solo';
  const travellerCount = parseInt(document.getElementById('travellerCountInput').value) || 1;

  const styleCheckboxes = document.querySelectorAll('input[name="travelStyle"]:checked');
  const styles = Array.from(styleCheckboxes).map(c => c.value);

  const accommodation = document.getElementById('accommodationSelect').value;
  const pace = document.getElementById('paceSelect').value;

  const start = new Date(dep);
  const end = new Date(ret);
  const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

  const submitBtn = document.querySelector('#planTripForm button[type="submit"]');
  const submitBtnSpan = submitBtn ? submitBtn.querySelector('span') : null;
  const originalText = 'Save & Generate Scrapbook Itinerary';

  // EDIT OPERATION
  if (state.editingTripId) {
    const tripId = state.editingTripId;
    const updatedTrip = {
      destination: dest,
      title: `${dest} Journey 🌸`,
      dates: `${dep} to ${ret}`,
      duration: `${diffDays} Days`,
      hotel: `${accommodation} in ${dest.split(',')[0]}`,
      pace: pace,
      budget: `${currency}${budget.toLocaleString()}`,
      currency: currency,
      travellerType: travellerType,
      travellerCount: travellerCount,
      travelStyles: styles,
      accommodation: accommodation
    };

    try {
      await JourneyBuddyDB.editTrip(tripId, updatedTrip);
      state.editingTripId = null;
      if (submitBtnSpan) submitBtnSpan.textContent = originalText;

      await initializePersistentData();
      await loadTripDataFromDB(tripId, true);
      showToast(`✨ Trip to ${dest} updated in database!`);
    } catch (err) {
      showToast(`Error updating trip: ${err.message}`);
    }
    return;
  }

  // CREATE TRIP WITH GROQ AI (/generate-trip)
  const preferences = {
    destination: dest,
    departure: dep,
    returnDate: ret,
    duration: diffDays,
    budget: budget,
    currency: currency,
    travellerType: travellerType,
    travellerCount: travellerCount,
    travelStyles: styles,
    accommodation: accommodation,
    pace: pace
  };

  // Basic Loading State with Glassmorphism Page Skeleton
  if (submitBtn) submitBtn.disabled = true;
  if (submitBtnSpan) submitBtnSpan.textContent = '✨ JourneyBuddy is crafting your pastel journey... 🌸';
  showPageSkeleton(`✨ JourneyBuddy is crafting your pastel journey to ${dest}... 🌸`);

  try {
    const result = await JourneyBuddyDB.generateTrip(preferences);

    if (result && result.trip) {
      state.trips.unshift(result.trip);
      renderMyTrips();
      await loadTripDataFromDB(result.trip.id, true);
      hidePageSkeleton();
      showToast(`✨ JourneyBuddy generated your trip to ${dest}! 🌸`);
    } else {
      throw new Error('Invalid response from AI generator');
    }
  } catch (err) {
    hidePageSkeleton();
    console.error('AI Generation Error:', err);
    showToast(`⚠️ AI Generation Notice: ${err.message}`);
    // Basic retry handling
    if (submitBtnSpan) submitBtnSpan.textContent = 'Retry JourneyBuddy Generation 🔄';
    if (submitBtn) submitBtn.disabled = false;
    return;
  } finally {
    hidePageSkeleton();
    if (submitBtn && submitBtnSpan && submitBtnSpan.textContent.includes('JourneyBuddy is crafting')) {
      submitBtnSpan.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
}

function showPageSkeleton(message = '✨ JourneyBuddy is crafting your pastel journey... 🌸') {
  const skeleton = document.getElementById('pageSkeleton');
  const msgEl = document.getElementById('skeletonStatusMsg');
  if (msgEl) msgEl.textContent = message;
  if (skeleton) {
    skeleton.style.display = 'block';
    skeleton.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hidePageSkeleton() {
  const skeleton = document.getElementById('pageSkeleton');
  if (skeleton) {
    skeleton.style.display = 'none';
  }
}

function quickPlanDestination(destination, style, accommodation) {
  navigateTo('plan');
  const destInput = document.getElementById('destinationInput');
  const accomSelect = document.getElementById('accommodationSelect');
  if (destInput) destInput.value = destination;
  if (accomSelect) accomSelect.value = accommodation;
  showToast(`✨ Pre-filled details for ${destination}!`);
}

// ==========================================
// SECTION 3: ITINERARY
// ==========================================

function renderItineraryTabs() {
  const tabsList = document.getElementById('dayTabsList');
  if (!tabsList) return;

  const dayKeys = Object.keys(state.itineraryDays).sort((a, b) => parseInt(a) - parseInt(b));
  tabsList.innerHTML = dayKeys.map(d => `
    <button class="day-tab ${parseInt(d) === state.currentDayTab ? 'active' : ''}" data-day="${d}">
      <span class="tab-d">Day ${d}</span>
      <span class="tab-sub">Explorer</span>
    </button>
  `).join('');
}

function renderItineraryDay(dayNumber) {
  state.currentDayTab = dayNumber;

  const tabs = document.querySelectorAll('.day-tab');
  tabs.forEach(tab => {
    const d = parseInt(tab.getAttribute('data-day'));
    if (d === dayNumber) tab.classList.add('active');
    else tab.classList.remove('active');
  });

  const dayData = state.itineraryDays[dayNumber] || {
    city: state.currentTrip.destination,
    hotel: state.currentTrip.hotelName,
    morning: [
      { id: 'm_gen', time: '09:00 AM', title: 'Morning Bakery & Coffee Walk 🥐', desc: 'Find a cute neighborhood cafe and map out morning adventures.', cost: '$12', tags: ['Cafe'], done: false }
    ],
    afternoon: [
      { id: 'a_gen', time: '01:30 PM', title: 'Local Heritage Sightseeing & Photo Walk 📷', desc: 'Explore historic alleys and browse quaint souvenir shops.', cost: '$15', tags: ['Sightseeing'], done: false }
    ],
    evening: [
      { id: 'e_gen', time: '07:00 PM', title: 'Cozy Dinner & Night Atmosphere 🌙', desc: 'Taste local delicacies and write in your JourneyBuddy journal.', cost: '$25', tags: ['Dinner'], done: false }
    ]
  };

  document.getElementById('currentCityLabel').textContent = dayData.city;
  document.getElementById('currentHotelLabel').textContent = dayData.hotel;

  renderScheduleList('morningCards', dayData.morning, dayNumber, 'morning');
  renderScheduleList('afternoonCards', dayData.afternoon, dayNumber, 'afternoon');
  renderScheduleList('eveningCards', dayData.evening, dayNumber, 'evening');
}

function renderScheduleList(containerId, items, dayNumber, slot) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-style: italic; font-family: var(--font-hand); font-size: 1.1rem; padding: 10px;">Free time to wander & relax 🌸</p>`;
    return;
  }

  container.innerHTML = items.map((item, index) => `
    <div class="sched-item ${item.done ? 'completed' : ''}">
      <input type="checkbox" class="sched-check" ${item.done ? 'checked' : ''} onchange="toggleScheduleDone(${dayNumber}, '${slot}', ${index})">
      <div class="sched-info">
        <span class="sched-time-badge">⏰ ${item.time}</span>
        <h4 class="sched-name">${item.title}</h4>
        <p class="sched-desc">${item.desc}</p>
        <div class="sched-tags-row">
          ${item.tags ? item.tags.map(t => `<span class="sched-tag">${t.startsWith('#') ? t : '#' + t}</span>`).join('') : ''}
        </div>
      </div>
      <span class="sched-cost">${item.cost}</span>
    </div>
  `).join('');
}

async function toggleScheduleDone(dayNumber, slot, index) {
  if (state.itineraryDays[dayNumber] && state.itineraryDays[dayNumber][slot][index]) {
    state.itineraryDays[dayNumber][slot][index].done = !state.itineraryDays[dayNumber][slot][index].done;
    renderItineraryDay(dayNumber);
    await JourneyBuddyDB.saveItinerary(state.currentTrip.id, state.itineraryDays);
    showToast('✨ Schedule saved to database!');
  }
}

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.day-tab');
  if (tab) {
    const day = parseInt(tab.getAttribute('data-day'));
    if (!isNaN(day)) renderItineraryDay(day);
  }
});

async function addNewDayTab() {
  const existingDays = Object.keys(state.itineraryDays).map(k => parseInt(k));
  const nextDay = (existingDays.length > 0 ? Math.max(...existingDays) : 0) + 1;

  state.itineraryDays[nextDay] = {
    city: state.currentTrip.destination,
    hotel: state.currentTrip.hotelName,
    morning: [
      { id: `m_${nextDay}`, time: '09:00 AM', title: `Day ${nextDay} Sunny Morning Walk ☀️`, desc: 'Explore fresh parks and morning markets.', cost: '$10', tags: ['Walk'], done: false }
    ],
    afternoon: [
      { id: `a_${nextDay}`, time: '02:00 PM', title: 'Local Hidden Gem Visit 🎨', desc: 'Visit a boutique museum or cozy neighborhood cafe.', cost: '$15', tags: ['Culture'], done: false }
    ],
    evening: [
      { id: `e_${nextDay}`, time: '07:30 PM', title: 'Farewell Dinner & Night Lights 🏮', desc: 'Celebrate memorable moments with delicious local bites.', cost: '$30', tags: ['Dinner'], done: false }
    ]
  };

  await JourneyBuddyDB.saveItinerary(state.currentTrip.id, state.itineraryDays);
  renderItineraryTabs();
  renderItineraryDay(nextDay);
  showToast(`🌸 Day ${nextDay} saved to backend database!`);
}

async function addCustomActivity(e) {
  e.preventDefault();
  const slot = document.getElementById('activityTimeSlot').value;
  const title = document.getElementById('activityTitle').value.trim();
  const loc = document.getElementById('activityLocation').value.trim();
  const day = state.currentDayTab;

  if (!state.itineraryDays[day]) {
    state.itineraryDays[day] = { city: state.currentTrip.destination, hotel: state.currentTrip.hotelName, morning: [], afternoon: [], evening: [] };
  }

  const timeMap = { morning: '10:00 AM', afternoon: '02:30 PM', evening: '08:00 PM' };

  state.itineraryDays[day][slot].push({
    id: 'cust_' + Date.now(),
    time: timeMap[slot] || '12:00 PM',
    title: title,
    desc: loc || 'Self-guided scrapbook discovery.',
    cost: '$10',
    tags: ['Custom', 'Memory'],
    done: false
  });

  await JourneyBuddyDB.saveItinerary(state.currentTrip.id, state.itineraryDays);

  document.getElementById('activityTitle').value = '';
  document.getElementById('activityLocation').value = '';

  renderItineraryDay(day);
  showToast('🎀 Activity stored in database!');
}

function printOrExport() {
  window.print();
}

// ==========================================
// SECTION 4: PACKING LIST
// ==========================================

function renderPackingList() {
  const categories = ['clothes', 'toiletries', 'tech', 'docs'];
  
  categories.forEach(cat => {
    const listElem = document.getElementById(`packList-${cat}`);
    if (!listElem) return;

    const items = state.packingItems.filter(item => item.cat === cat);
    listElem.innerHTML = items.map(item => `
      <li class="check-item ${item.done ? 'done' : ''}">
        <label class="check-label">
          <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePackItem('${item.id}')">
          <span>${item.name}</span>
        </label>
        <button class="delete-item-btn" onclick="deletePackItem('${item.id}')" title="Delete">✕</button>
      </li>
    `).join('');
  });

  const total = state.packingItems.length;
  const packed = state.packingItems.filter(i => i.done).length;
  const percent = total > 0 ? Math.round((packed / total) * 100) : 0;

  const progressText = document.getElementById('packingProgressText');
  const percentText = document.getElementById('packingPercentText');
  const progressBar = document.getElementById('packingProgressBar');

  if (progressText) progressText.textContent = `Packed: ${packed} / ${total} items`;
  if (percentText) percentText.textContent = `${percent}% Ready! 🎒`;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

async function togglePackItem(id) {
  const item = state.packingItems.find(i => i.id === id);
  if (item) {
    item.done = !item.done;
    renderPackingList();
    await JourneyBuddyDB.savePacking(state.currentTrip.id, state.packingItems);
  }
}

async function deletePackItem(id) {
  state.packingItems = state.packingItems.filter(i => i.id !== id);
  renderPackingList();
  await JourneyBuddyDB.savePacking(state.currentTrip.id, state.packingItems);
  showToast('🗑️ Item removed from database.');
}

async function addPackingItem(e) {
  e.preventDefault();
  const cat = document.getElementById('packCategorySelect').value;
  const nameInput = document.getElementById('packItemName');
  const name = nameInput.value.trim();

  if (!name) return;

  const targetCat = cat === 'misc' ? 'clothes' : cat;

  state.packingItems.push({
    id: 'pack_' + Date.now(),
    cat: targetCat,
    name: name,
    done: false
  });

  nameInput.value = '';
  renderPackingList();
  await JourneyBuddyDB.savePacking(state.currentTrip.id, state.packingItems);
  showToast('✏️ Packed item saved in database!');
}

// ==========================================
// SECTION 5: BUDGET
// ==========================================

function renderBudget() {
  const curr = state.budget.currency || '$';
  const total = state.budget.total || 2500;
  
  const totalSpent = (state.budget.expenses || []).reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, total - totalSpent);

  document.getElementById('budgetTotalDisplay').textContent = `${curr}${total.toLocaleString()}`;
  document.getElementById('budgetSpentDisplay').textContent = `${curr}${totalSpent.toLocaleString()}`;
  document.getElementById('budgetRemainingDisplay').textContent = `${curr}${remaining.toLocaleString()}`;

  const tableBody = document.getElementById('expenseTableBody');
  if (tableBody) {
    tableBody.innerHTML = (state.budget.expenses || []).map(exp => `
      <tr>
        <td><strong>${exp.name}</strong></td>
        <td><span class="sched-tag">🏷️ ${exp.cat}</span></td>
        <td><strong>${curr}${exp.amount.toFixed(2)}</strong></td>
        <td><button class="delete-item-btn" onclick="deleteExpense('${exp.id}')">✕</button></td>
      </tr>
    `).join('');
  }

  updateCategoryProgress('Stay', 'barStayVal', 1000);
  updateCategoryProgress('Food', 'barFoodVal', 600);
  updateCategoryProgress('Activities', 'barActVal', 300);
  updateCategoryProgress('Transport', 'barTransVal', 250);
  updateCategoryProgress('Souvenirs', 'barSouvVal', 350);
}

function updateCategoryProgress(categoryName, labelId, maxAllocated) {
  const curr = state.budget.currency || '$';
  const catExpenses = (state.budget.expenses || [])
    .filter(e => e.cat.toLowerCase() === categoryName.toLowerCase())
    .reduce((s, e) => s + e.amount, 0);

  const labelElem = document.getElementById(labelId);
  if (labelElem) {
    labelElem.textContent = `${curr}${catExpenses.toFixed(0)} / ${curr}${maxAllocated}`;
  }
}

async function addExpenseLog(e) {
  e.preventDefault();
  const name = document.getElementById('expenseName').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const cat = document.getElementById('expenseCategory').value;

  if (!name || isNaN(amount) || amount <= 0) return;

  if (!state.budget.expenses) state.budget.expenses = [];
  state.budget.expenses.unshift({
    id: 'exp_' + Date.now(),
    name: name,
    cat: cat,
    amount: amount
  });

  document.getElementById('expenseName').value = '';
  document.getElementById('expenseAmount').value = '';

  renderBudget();
  await JourneyBuddyDB.saveBudget(state.currentTrip.id, state.budget);
  showToast('🪙 Purchase saved to database!');
}

async function deleteExpense(id) {
  state.budget.expenses = (state.budget.expenses || []).filter(e => e.id !== id);
  renderBudget();
  await JourneyBuddyDB.saveBudget(state.currentTrip.id, state.budget);
  showToast('Receipt deleted & updated in database!');
}

// ==========================================
// SECTION 6: MY TRIPS (VIEW, EDIT, DELETE)
// ==========================================

function renderMyTrips(filter = 'all') {
  const container = document.getElementById('myTripsGrid');
  if (!container) return;

  // Update filter pill label with actual count if present
  const allPill = document.querySelector('.filter-pill[onclick*="all"]');
  if (allPill) {
    allPill.textContent = `All Journeys (${state.trips.length})`;
  }

  let tripsToDisplay = state.trips;
  if (filter === 'upcoming') {
    tripsToDisplay = state.trips.filter(t => t.status === 'upcoming');
  } else if (filter === 'completed') {
    tripsToDisplay = state.trips.filter(t => t.status === 'completed');
  }

  if (tripsToDisplay.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-soft); font-family: var(--font-hand); font-size: 1.3rem;">No trips yet! Plan a cute trip above 🌸</p>`;
    return;
  }

  container.innerHTML = tripsToDisplay.map(trip => `
    <div class="trip-polaroid-card">
      <div class="washi-tape washi-yellow pin-tape"></div>
      <div class="trip-card-cover" style="background-image: url('${trip.image}');">
        <span class="trip-badge">${trip.status === 'completed' ? 'Memory 🌸' : 'Upcoming ✈️'}</span>
      </div>
      <div class="trip-card-body">
        <h3>${trip.title}</h3>
        <p class="trip-card-dates">📅 ${trip.dates} (${trip.duration})</p>
        <p style="font-size: 0.9rem; color: var(--text-soft); margin-bottom: 8px;">🏨 ${trip.hotel}</p>
        <div class="trip-card-tags">
          ${trip.tags ? trip.tags.map(tag => `<span class="trip-tag">${tag}</span>`).join('') : ''}
        </div>
        <div class="trip-card-actions">
          <button class="btn btn-mint" style="flex: 1;" onclick="loadTripIntoItinerary('${trip.id}')">View ➔</button>
          <button class="btn btn-outline" style="padding: 8px 14px;" onclick="startEditTrip('${trip.id}')" title="Edit trip">✏️</button>
          <button class="btn btn-outline" style="padding: 8px 14px; color: #ff6b6b;" onclick="deleteTripFromDB('${trip.id}')" title="Delete trip">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function deleteTripFromDB(tripId) {
  const confirmed = confirm('Are you sure you want to delete this cute trip from your scrapbook? 🌸');
  if (!confirmed) return;

  try {
    await JourneyBuddyDB.deleteTrip(tripId);
    state.trips = state.trips.filter(t => t.id !== tripId);
    renderMyTrips();
    showToast('🗑️ Trip deleted from database!');

    if (state.currentTrip.id === tripId && state.trips.length > 0) {
      await loadTripDataFromDB(state.trips[0].id, false);
    }
  } catch (err) {
    showToast('Error deleting trip: ' + err.message);
  }
}

function filterTrips(type) {
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(p => p.classList.remove('active'));
  if (window.event && window.event.target && window.event.target.classList.contains('filter-pill')) {
    window.event.target.classList.add('active');
  }
  renderMyTrips(type);
}

async function loadTripIntoItinerary(tripId) {
  await loadTripDataFromDB(tripId, true);
}
