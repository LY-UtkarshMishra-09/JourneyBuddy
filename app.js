/**
 * TravelMate - Cute Pastel Scrapbook Travel Planner
 * Functional Vanilla JS with Minimal Persistent IndexedDB (db.js)
 */

// ==========================================
// STATE & SEED DATA
// ==========================================

const state = {
  activeView: 'home',
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
  trips: [
    {
      id: 'trip-kyoto',
      destination: 'Kyoto, Japan',
      title: 'Kyoto Cherry Blossom Dreams 🌸',
      dates: 'April 10 - April 14, 2026',
      duration: '5 Days',
      status: 'upcoming',
      hotel: 'Ryokan Gion Sano',
      pace: 'Balanced',
      budget: '$2,500',
      currency: '$',
      travellerType: 'solo',
      travellerCount: 1,
      travelStyles: ['Cultural & Historic', 'Foodie Trail'],
      accommodation: 'Cozy Airbnb / Ryokan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=700&q=80',
      tags: ['🌸 Sakura', '🍵 Matcha', '⛩️ Shrines']
    },
    {
      id: 'trip-santorini',
      destination: 'Santorini, Greece',
      title: 'Amalfi & Aegean Seashells 🐚',
      dates: 'July 14 - July 20, 2026',
      duration: '7 Days',
      status: 'upcoming',
      hotel: 'Canaves Oia Suites',
      pace: 'Relaxed & Chilled',
      budget: '€3,200',
      currency: '€',
      travellerType: 'couple',
      travellerCount: 2,
      travelStyles: ['Beach & Chill', 'Romantic'],
      accommodation: 'Luxury Beach Resort',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=80',
      tags: ['🌊 Beach', '🌅 Sunsets', '🍷 Wine']
    },
    {
      id: 'trip-bali',
      destination: 'Bali, Indonesia',
      title: 'Ubud Rice Terrace & Coffee 🌴',
      dates: 'November 05 - November 12, 2025',
      duration: '8 Days',
      status: 'completed',
      hotel: 'Bambu Indah Eco Resort',
      pace: 'Balanced',
      budget: '$1,800',
      currency: '$',
      travellerType: 'friends',
      travellerCount: 3,
      travelStyles: ['Adventure', 'Foodie Trail'],
      accommodation: 'Cozy Airbnb / Ryokan',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=80',
      tags: ['🥥 Coconuts', '🧘 Yoga', '🌿 Waterfalls']
    }
  ],
  itineraryDays: {
    1: {
      city: 'Kyoto, Kansai Region',
      hotel: 'Ryokan Gion Sano (Tatami & Garden View)',
      morning: [
        { id: 'm1', time: '08:30 AM', title: 'Arrival at Kyoto Station & Eki Bento 🍱', desc: 'Pick up IC transit card and savor seasonal bento breakfast.', cost: '$14', tags: ['Food', 'Transit'], done: true },
        { id: 'm2', time: '10:30 AM', title: 'Check into Traditional Ryokan in Gion', desc: 'Drop heavy bags, enjoy welcome roasted green tea and sweets.', cost: 'Included', tags: ['Relax'], done: true }
      ],
      afternoon: [
        { id: 'a1', time: '01:00 PM', title: 'Kiyomizu-dera Wooden Stage & City Vista 🏯', desc: 'Walk up Matsubara street, drink from Otowa spring fountain.', cost: '$6', tags: ['Temple', 'Views'], done: false },
        { id: 'a2', time: '03:30 PM', title: 'Sannenzaka & Ninenzaka Traditional Lanes', desc: 'Browse handcrafted ceramics, incense, and soft matcha soft-serve.', cost: '$8', tags: ['Walk', 'Cafe'], done: false }
      ],
      evening: [
        { id: 'e1', time: '06:00 PM', title: 'Lantern-Lit Gion Geisha District Stroll 🏮', desc: 'Spot lanterns reflected on cobblestones and wooden teahouses.', cost: 'Free', tags: ['Atmosphere'], done: false },
        { id: 'e2', time: '07:30 PM', title: 'Cozy Kaiseki Multi-Course Dinner', desc: 'Tasting seasonal tofu, bamboo shoots, and Kyoto beef skewers.', cost: '$55', tags: ['Dinner'], done: false }
      ]
    },
    2: {
      city: 'Arashiyama Bamboo Grove',
      hotel: 'Ryokan Gion Sano (Tatami & Garden View)',
      morning: [
        { id: 'm21', time: '07:30 AM', title: 'Early Morning Stroll in Arashiyama Bamboo Grove 🎋', desc: 'Catch the golden hour breeze before tourist crowds arrive.', cost: 'Free', tags: ['Nature', 'Photo'], done: false },
        { id: 'm22', time: '09:30 AM', title: 'Tenryu-ji Zen Garden & Dragon Ceiling 🐉', desc: 'Meditate by the pond surrounded by pine trees and weeping cherry.', cost: '$7', tags: ['Zen'], done: false }
      ],
      afternoon: [
        { id: 'a21', time: '12:30 PM', title: 'Togetsukyo Bridge & Riverbank Bento Picnic 🍙', desc: 'Riverside onigiri and iced hojicha tea watching wooden boats.', cost: '$12', tags: ['Picnic'], done: false },
        { id: 'a22', time: '02:30 PM', title: 'Iwatayama Monkey Park Hike 🐒', desc: 'Short scenic 20-min hike up the hill for panoramic views of Kyoto.', cost: '$6', tags: ['Hike', 'Views'], done: false }
      ],
      evening: [
        { id: 'e21', time: '06:30 PM', title: 'Yudofu Hot-Pot Dinner at Sagano 🍲', desc: 'Simmered silk tofu in kelp broth with ginger, scallions, and yuzu sauce.', cost: '$30', tags: ['Specialty'], done: false },
        { id: 'e22', time: '08:30 PM', title: 'Foot Bath Cafe (Ashi-yu) Experience', desc: 'Soak feet in hot mineral springs while sipping peach soda.', cost: '$10', tags: ['Cozy'], done: false }
      ]
    },
    3: {
      city: 'Southern Kyoto & Uji',
      hotel: 'Ryokan Gion Sano (Tatami & Garden View)',
      morning: [
        { id: 'm31', time: '07:00 AM', title: 'Fushimi Inari-taisha Senbon Torii Hike ⛩️', desc: 'Hike through 10,000 orange shrine gates winding through sacred mount Inari.', cost: 'Free', tags: ['Must-See', 'Hike'], done: false }
      ],
      afternoon: [
        { id: 'a31', time: '12:30 PM', title: 'Train ride to Uji (Matcha Capital) 🍵', desc: 'Visit Byodoin Phoenix Hall featured on the 10-yen coin.', cost: '$8', tags: ['Culture'], done: false },
        { id: 'a32', time: '03:00 PM', title: 'Authentic Matcha Whisking Workshop', desc: 'Learn ceremonial tea preparation with traditional wagashi confectionery.', cost: '$25', tags: ['Workshop'], done: false }
      ],
      evening: [
        { id: 'e31', time: '06:30 PM', title: 'Pontocho Alley Izakaya Hop 🍢', desc: 'Narrow lantern-lined alleyway beside Kamogawa river with grilled yakitori.', cost: '$35', tags: ['Nightlife', 'Food'], done: false }
      ]
    },
    4: {
      city: 'Northern Kyoto (Kinkaku-ji)',
      hotel: 'Ryokan Gion Sano (Tatami & Garden View)',
      morning: [
        { id: 'm41', time: '09:00 AM', title: 'Kinkaku-ji (The Golden Pavilion) ✨', desc: 'Marvel at the gold-leaf Zen temple shimmering over Kyoko-chi mirror pond.', cost: '$5', tags: ['Landmark'], done: false },
        { id: 'm42', time: '11:00 AM', title: 'Ryoan-ji Famous Rock Garden', desc: 'Contemplate 15 mysterious stones arranged in raked white gravel.', cost: '$5', tags: ['Peaceful'], done: false }
      ],
      afternoon: [
        { id: 'a41', time: '01:00 PM', title: 'Nishiki Market Food Tasting 🦪', desc: 'Known as Kyoto’s Kitchen: skewered octopus, tamagoyaki egg, sweet dango.', cost: '$20', tags: ['Market'], done: false }
      ],
      evening: [
        { id: 'e41', time: '06:30 PM', title: 'Sunset along Kamogawa River Bank 🌅', desc: 'Join locals sitting spaced out along the gentle river enjoying pastries.', cost: 'Free', tags: ['Chill'], done: false }
      ]
    },
    5: {
      city: 'Kyoto to Kansai / Farewell',
      hotel: 'Check-out Morning',
      morning: [
        { id: 'm51', time: '09:00 AM', title: 'Ryokan Farewell Traditional Breakfast 🥣', desc: 'Miso soup, grilled salmon, tamagoyaki, and pickled plum.', cost: 'Included', tags: ['Food'], done: false },
        { id: 'm52', time: '10:30 AM', title: 'Philosopher’s Path Souvenir Shopping 🛍️', desc: 'Pick up chirimen cloth coin purses, washi tape, and yatsuhashi cookies.', cost: '$40', tags: ['Gifts'], done: false }
      ],
      afternoon: [
        { id: 'a51', time: '01:30 PM', title: 'Haruka Hello Kitty Express to Kansai Airport ✈️', desc: 'Cute themed scenic train ride directly to airport terminal.', cost: '$22', tags: ['Transit'], done: false }
      ],
      evening: [
        { id: 'e51', time: '05:00 PM', title: 'Airport Lounge & Scrapbook Journaling ✍️', desc: 'Paste all train stubs and ticket receipts into TravelMate journal!', cost: 'Free', tags: ['Journal'], done: false }
      ]
    }
  },
  packingItems: [
    { id: 'p1', cat: 'clothes', name: 'Comfortable walking sneakers 👟', done: true },
    { id: 'p2', cat: 'clothes', name: 'Pastel cardigan & lightweight jacket 🧥', done: true },
    { id: 'p3', cat: 'clothes', name: '3x linen tops & midi skirts 👗', done: true },
    { id: 'p4', cat: 'clothes', name: 'Slip-on socks for temple floors 🧦', done: false },
    { id: 'p5', cat: 'toiletries', name: 'Moisturizing sunscreen SPF50 🧴', done: true },
    { id: 'p6', cat: 'toiletries', name: 'Travel-size shampoo & conditioner 🫧', done: true },
    { id: 'p7', cat: 'toiletries', name: 'Pocket hand sanitizer & wipes 🧼', done: false },
    { id: 'p8', cat: 'toiletries', name: 'Lavender face mist & lip balm 🌸', done: true },
    { id: 'p9', cat: 'tech', name: 'Pocket Wi-Fi / e-SIM voucher 📱', done: true },
    { id: 'p10', cat: 'tech', name: 'Power bank & charging cables 🔋', done: true },
    { id: 'p11', cat: 'tech', name: 'Type A plug adapter for Japan 🔌', done: false },
    { id: 'p12', cat: 'tech', name: 'Vintage film camera + extra roll 📸', done: true },
    { id: 'p13', cat: 'docs', name: 'Passport with 6+ months validity 🛂', done: true },
    { id: 'p14', cat: 'docs', name: 'Printed hotel confirmation slips 📄', done: false },
    { id: 'p15', cat: 'docs', name: 'Japanese Yen Cash (coin pouch ready!) 💴', done: true },
    { id: 'p16', cat: 'docs', name: 'Travel Insurance policy printout 🩺', done: false }
  ],
  budget: {
    total: 2500,
    currency: '$',
    expenses: [
      { id: 'ex1', name: 'Ryokan 4 Nights Booking', cat: 'Stay', amount: 750 },
      { id: 'ex2', name: 'JR Haruka Airport Express Rail Pass', cat: 'Transport', amount: 48 },
      { id: 'ex3', name: 'Kaiseki Dinner in Gion', cat: 'Food', amount: 110 },
      { id: 'ex4', name: 'Matcha Tea Ceremony in Uji', cat: 'Activities', amount: 50 },
      { id: 'ex5', name: 'Fushimi Inari Wooden Shrine Charms', cat: 'Souvenirs', amount: 35 },
      { id: 'ex6', name: 'Arashiyama Monkey Park & Bamboo', cat: 'Activities', amount: 15 },
      { id: 'ex7', name: 'Nishiki Market Skewers & Sweets', cat: 'Food', amount: 32 }
    ]
  },
  currentDayTab: 1
};

// ==========================================
// DOM & DATABASE INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupPlanTripForm();
  setupMobileMenu();

  // Initialize DB and load persistent state
  await initializePersistentData();

  renderItineraryDay(state.currentDayTab);
  renderPackingList();
  renderBudget();
  renderMyTrips();
});

async function initializePersistentData() {
  try {
    await TravelMateDB.openDB();
    const storedTrips = await TravelMateDB.getAllTrips();

    if (!storedTrips || storedTrips.length === 0) {
      // Seed default initial data into IndexedDB
      for (const trip of state.trips) {
        await TravelMateDB.saveTrip(trip);
      }
      // Seed Kyoto itinerary
      for (const day in state.itineraryDays) {
        await TravelMateDB.saveItineraryDay('trip-kyoto', day, state.itineraryDays[day]);
      }
      // Seed packing & budget
      await TravelMateDB.savePacking('trip-kyoto', state.packingItems);
      await TravelMateDB.saveBudget('trip-kyoto', state.budget);
    } else {
      // Load saved trips from IndexedDB
      state.trips = storedTrips;
      const initialTrip = storedTrips[0];
      if (initialTrip) {
        await loadTripDataFromDB(initialTrip.id, false);
      }
    }
  } catch (err) {
    console.warn('IndexedDB initial sync error, fallback to memory:', err);
  }
}

async function loadTripDataFromDB(tripId, switchView = true) {
  const trip = state.trips.find(t => t.id === tripId);
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

  // Itinerary
  try {
    const itins = await TravelMateDB.getTripItineraries(tripId);
    if (itins && itins.length > 0) {
      state.itineraryDays = {};
      itins.forEach(item => {
        state.itineraryDays[item.day] = {
          city: item.city,
          hotel: item.hotel,
          morning: item.morning || [],
          afternoon: item.afternoon || [],
          evening: item.evening || []
        };
      });
    }
  } catch (e) {
    console.warn('Could not load itinerary from DB:', e);
  }

  // Packing
  try {
    const packing = await TravelMateDB.getPacking(tripId);
    if (packing) {
      state.packingItems = packing;
    }
  } catch (e) {
    console.warn('Could not load packing from DB:', e);
  }

  // Budget
  try {
    const bgt = await TravelMateDB.getBudget(tripId);
    if (bgt) {
      state.budget = {
        total: bgt.total || 2500,
        currency: bgt.currency || '$',
        expenses: bgt.expenses || []
      };
    }
  } catch (e) {
    console.warn('Could not load budget from DB:', e);
  }

  // Update UI Elements
  document.getElementById('itineraryTitle').textContent = trip.title;
  document.getElementById('itineraryDates').textContent = `📅 ${trip.dates} (${trip.duration})`;
  document.getElementById('itineraryPace').textContent = `🚶 ${trip.pace}`;
  document.getElementById('itineraryParty').textContent = `👥 ${trip.travellerCount || 1} Traveller(s)`;
  document.getElementById('currentCityLabel').textContent = trip.destination;
  document.getElementById('currentHotelLabel').textContent = trip.hotel;

  renderItineraryDay(1);
  renderPackingList();
  renderBudget();

  if (switchView) {
    navigateTo('itinerary');
    showToast(`🌸 Loaded ${trip.destination} into your scrapbook!`);
  }
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

  // Toggle view containers
  const views = document.querySelectorAll('.view-section');
  views.forEach(view => {
    view.classList.remove('active');
  });

  const activeElem = document.getElementById(`view-${targetView}`);
  if (activeElem) {
    activeElem.classList.add('active');
  }

  // Update Nav links
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    if (btn.getAttribute('data-target') === targetView) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Close mobile drawer if open
  const navMenu = document.getElementById('navMenu');
  if (navMenu) navMenu.classList.remove('show');

  // Smooth scroll to top of page
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

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2800);
}

// ==========================================
// SECTION 2: PLAN TRIP FORM
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
  const newTripId = 'trip-' + Date.now();

  state.currentTrip = {
    id: newTripId,
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
    hotelName: `${accommodation} in ${dest.split(',')[0]}`,
    pace: pace,
    status: 'upcoming'
  };

  const newTripCard = {
    id: newTripId,
    destination: dest,
    title: `${dest} Scrapbook Trip 🌸`,
    dates: `${dep} to ${ret}`,
    duration: `${diffDays} Days`,
    status: 'upcoming',
    hotel: state.currentTrip.hotelName,
    pace: pace,
    budget: `${currency}${budget.toLocaleString()}`,
    currency: currency,
    travellerType: travellerType,
    travellerCount: travellerCount,
    travelStyles: styles,
    accommodation: accommodation,
    image: getRandomTripImage(dest),
    tags: styles.length ? styles.map(s => '#' + s.split(' ')[0]) : ['#Adventure', '#Cute']
  };

  // Add & persist trip to DB
  state.trips.unshift(newTripCard);
  await TravelMateDB.saveTrip(newTripCard);

  // Initialize fresh itinerary for this trip
  state.itineraryDays = {};
  for (let i = 1; i <= diffDays; i++) {
    state.itineraryDays[i] = {
      city: dest,
      hotel: state.currentTrip.hotelName,
      morning: [
        { id: `m_${i}`, time: '09:00 AM', title: `Morning Discovery in ${dest.split(',')[0]} 🥐`, desc: 'Explore historic alleys and morning street cafes.', cost: `${currency}15`, tags: ['Explore'], done: false }
      ],
      afternoon: [
        { id: `a_${i}`, time: '01:30 PM', title: 'Highlight Landmark Visit 🏛️', desc: 'Sightseeing, capturing polaroid memories, and resting by gardens.', cost: `${currency}20`, tags: ['Sightseeing'], done: false }
      ],
      evening: [
        { id: `e_${i}`, time: '07:00 PM', title: 'Sunset Dinner & Night Ambiance 🌙', desc: 'Savor regional dinner dishes and journal trip highlights.', cost: `${currency}30`, tags: ['Dinner'], done: false }
      ]
    };
    await TravelMateDB.saveItineraryDay(newTripId, i, state.itineraryDays[i]);
  }

  // Initialize fresh budget & packing for this trip
  state.budget = {
    total: budget,
    currency: currency,
    expenses: [
      { id: 'ex_' + Date.now(), name: `${dest.split(',')[0]} Stay Reservation`, cat: 'Stay', amount: Math.round(budget * 0.4) }
    ]
  };
  await TravelMateDB.saveBudget(newTripId, state.budget);
  await TravelMateDB.savePacking(newTripId, state.packingItems);

  renderMyTrips();

  // Update Itinerary Banner
  document.getElementById('itineraryTitle').textContent = `${dest} Journey`;
  document.getElementById('itineraryDates').textContent = `📅 ${dep} - ${ret} (${diffDays} Days)`;
  document.getElementById('itineraryPace').textContent = `🚶 ${pace}`;
  document.getElementById('itineraryParty').textContent = `👥 ${travellerCount} Traveller(s)`;
  document.getElementById('currentCityLabel').textContent = dest;
  document.getElementById('currentHotelLabel').textContent = state.currentTrip.hotelName;

  renderItineraryDay(1);
  renderBudget();

  showToast(`🎀 Trip to ${dest} saved persistently in database!`);
  navigateTo('itinerary');
}

function getRandomTripImage(dest) {
  const d = dest.toLowerCase();
  if (d.includes('paris') || d.includes('france')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=80';
  } else if (d.includes('santorini') || d.includes('greece') || d.includes('beach')) {
    return 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=80';
  } else if (d.includes('bali') || d.includes('indonesia')) {
    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=80';
  }
  return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=700&q=80';
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
      { id: 'e_gen', time: '07:00 PM', title: 'Cozy Dinner & Night Atmosphere 🌙', desc: 'Taste local delicacies and write in your TravelMate journal.', cost: '$25', tags: ['Dinner'], done: false }
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
          ${item.tags ? item.tags.map(t => `<span class="sched-tag">#${t}</span>`).join('') : ''}
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
    // Persist to DB
    await TravelMateDB.saveItineraryDay(state.currentTrip.id, dayNumber, state.itineraryDays[dayNumber]);
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
  const tabsList = document.getElementById('dayTabsList');
  const existingTabs = document.querySelectorAll('.day-tab');
  const nextDay = existingTabs.length + 1;

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

  // Persist day to DB
  await TravelMateDB.saveItineraryDay(state.currentTrip.id, nextDay, state.itineraryDays[nextDay]);

  const newBtn = document.createElement('button');
  newBtn.className = 'day-tab';
  newBtn.setAttribute('data-day', nextDay);
  newBtn.innerHTML = `
    <span class="tab-d">Day ${nextDay}</span>
    <span class="tab-sub">Custom Explorer</span>
  `;
  tabsList.appendChild(newBtn);

  renderItineraryDay(nextDay);
  showToast(`🌸 Day ${nextDay} saved to database!`);
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

  // Persist to DB
  await TravelMateDB.saveItineraryDay(state.currentTrip.id, day, state.itineraryDays[day]);

  document.getElementById('activityTitle').value = '';
  document.getElementById('activityLocation').value = '';

  renderItineraryDay(day);
  showToast('🎀 Activity stored persistently!');
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
    await TravelMateDB.savePacking(state.currentTrip.id, state.packingItems);
  }
}

async function deletePackItem(id) {
  state.packingItems = state.packingItems.filter(i => i.id !== id);
  renderPackingList();
  await TravelMateDB.savePacking(state.currentTrip.id, state.packingItems);
  showToast('🗑️ Item removed & updated in DB.');
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
  await TravelMateDB.savePacking(state.currentTrip.id, state.packingItems);
  showToast('✏️ Packed item saved in DB!');
}

// ==========================================
// SECTION 5: BUDGET
// ==========================================

function renderBudget() {
  const curr = state.budget.currency || '$';
  const total = state.budget.total || 2500;
  
  const totalSpent = state.budget.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, total - totalSpent);

  document.getElementById('budgetTotalDisplay').textContent = `${curr}${total.toLocaleString()}`;
  document.getElementById('budgetSpentDisplay').textContent = `${curr}${totalSpent.toLocaleString()}`;
  document.getElementById('budgetRemainingDisplay').textContent = `${curr}${remaining.toLocaleString()}`;

  const tableBody = document.getElementById('expenseTableBody');
  if (tableBody) {
    tableBody.innerHTML = state.budget.expenses.map(exp => `
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
  const catExpenses = state.budget.expenses
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

  state.budget.expenses.unshift({
    id: 'exp_' + Date.now(),
    name: name,
    cat: cat,
    amount: amount
  });

  document.getElementById('expenseName').value = '';
  document.getElementById('expenseAmount').value = '';

  renderBudget();
  await TravelMateDB.saveBudget(state.currentTrip.id, state.budget);
  showToast('🪙 Purchase saved to persistent DB!');
}

async function deleteExpense(id) {
  state.budget.expenses = state.budget.expenses.filter(e => e.id !== id);
  renderBudget();
  await TravelMateDB.saveBudget(state.currentTrip.id, state.budget);
  showToast('Receipt deleted & updated in DB!');
}

// ==========================================
// SECTION 6: MY TRIPS
// ==========================================

function renderMyTrips(filter = 'all') {
  const container = document.getElementById('myTripsGrid');
  if (!container) return;

  let tripsToDisplay = state.trips;
  if (filter === 'upcoming') {
    tripsToDisplay = state.trips.filter(t => t.status === 'upcoming');
  } else if (filter === 'completed') {
    tripsToDisplay = state.trips.filter(t => t.status === 'completed');
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
          <button class="btn btn-mint btn-block" onclick="loadTripIntoItinerary('${trip.id}')">View Itinerary ➔</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterTrips(type) {
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(p => p.classList.remove('active'));
  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }
  renderMyTrips(type);
}

async function loadTripIntoItinerary(tripId) {
  await loadTripDataFromDB(tripId, true);
}
