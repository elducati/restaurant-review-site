/* ====================================================================
   RESTAURANT REVIEWS — APPLICATION
   ==================================================================== */

(function () {
  'use strict';

  // ================================================================
  // CONFIGURATION
  // ================================================================

  const CONFIG = {
    defaultCenter: { lat: -1.286389, lng: 36.817223 },
    defaultZoom: 14,
    placesRadius: 500,
    maxStars: 5,
    debounceMs: 800,
    cacheTTL: 5 * 60 * 1000,
    mapStyle: [
      { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
      { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f5f5f5' }] },
      { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#c8d7d4' }] },
    ],
  };

  // ================================================================
  // STATE
  // ================================================================

  const state = {
    restaurants: [],
    map: null,
    markers: new Map(),
    infoWindow: null,
    userMarker: null,
    userPosition: null,
    selectedRestaurantId: null,
    filterMinRating: 1,
    isAddingRestaurant: false,
    pendingLocation: null,
    streetViewService: null,
    googleReady: false,
  };

  // ================================================================
  // DOM REFERENCES (populated in init)
  // ================================================================

  let $ = {};

  function cacheElements() {
    $ = {
      map: document.getElementById('map'),
      mapLoading: document.getElementById('map-loading'),
      list: document.getElementById('restaurant-list'),
      count: document.getElementById('restaurant-count'),
      filterContainer: document.getElementById('star-filter'),
      filterValue: document.getElementById('filter-value'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebar-toggle'),
      sidebarBackdrop: document.getElementById('sidebar-backdrop'),
      reviewPanel: document.getElementById('review-panel'),
      panelBody: document.getElementById('panel-body'),
      panelContent: document.getElementById('panel-content'),
      panelClose: document.querySelector('.panel-close'),
      panelTitle: document.getElementById('panel-title'),
      addModal: document.getElementById('add-modal'),
      addForm: document.getElementById('add-form'),
      addName: document.getElementById('rest-name'),
      addAddress: document.getElementById('rest-address'),
      addRatingContainer: document.getElementById('rest-rating'),
      addCancelBtn: document.getElementById('add-cancel-btn'),
      addCloseBtn: document.querySelector('.modal-close'),
      addError: document.getElementById('add-error'),
      notification: document.getElementById('notification'),
      locateBtn: document.getElementById('locate-btn'),
      addRestHint: document.getElementById('add-rest-hint'),
    };
  }

  // ================================================================
  // UTILITY
  // ================================================================

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function generateId() {
    return 'rest-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function priceSymbols(level) {
    if (!level) return '';
    return '\u00A3'.repeat(Math.min(level, 4));
  }

  function getApiKey() {
    return window.GOOGLE_MAPS_API_KEY;
  }

  // ================================================================
  // NOTIFICATIONS
  // ================================================================

  function showNotification(message, type) {
    const el = $.notification;
    el.textContent = message;
    el.className = 'notification ' + (type || 'info');
    el.classList.remove('hidden');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.add('hidden'), 3500);
  }

  // ================================================================
  // DATA LAYER
  // ================================================================

  async function loadLocalRestaurants() {
    try {
      const res = await fetch('restaurants.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      data.forEach((r) => {
        r.source = 'local';
        r.isLocal = true;
        r.placeId = null;
      });
      state.restaurants = data;
    } catch (err) {
      console.error('Failed to load restaurants.json:', err);
      state.restaurants = [];
      showNotification('Could not load restaurant data', 'error');
    }
  }

  function getRestaurantById(id) {
    return state.restaurants.find((r) => r.id === id);
  }

  function effectiveRating(r) {
    return r.avgRating || state.filterMinRating;
  }

  function getFilteredRestaurants() {
    return state.restaurants.filter((r) => effectiveRating(r) >= state.filterMinRating);
  }

  function addRestaurantToState(data) {
    const restaurant = {
      id: generateId(),
      name: data.name.trim(),
      lat: data.lat,
      lng: data.lng,
      address: data.address || 'Unknown',
      avgRating: data.avgRating || 0,
      totalRatings: 0,
      priceLevel: data.priceLevel || null,
      source: 'user',
      isLocal: true,
      placeId: null,
      reviews: [],
    };
    state.restaurants.push(restaurant);
    renderAll();
    createMarker(restaurant);
    return restaurant;
  }

  function addReviewToState(restaurantId, reviewData) {
    const restaurant = getRestaurantById(restaurantId);
    if (!restaurant) return;
    const review = {
      author: reviewData.author || 'Anonymous',
      rating: reviewData.rating,
      text: reviewData.text || '',
      date: new Date().toISOString().slice(0, 10),
    };
    restaurant.reviews.push(review);
    const total = restaurant.reviews.reduce((s, r) => s + r.rating, 0);
    restaurant.avgRating = total / restaurant.reviews.length;
    renderAll();
    if (state.selectedRestaurantId === restaurantId) {
      renderPanelContent(restaurant);
    }
    showNotification('Review added!', 'success');
  }

  function removeRestaurant(id) {
    state.restaurants = state.restaurants.filter((r) => r.id !== id);
    const marker = state.markers.get(id);
    if (marker) { marker.setMap(null); state.markers.delete(id); }
    renderAll();
  }

  // ================================================================
  // GOOGLE MAPS API LOADER
  // ================================================================

  function loadGoogleMapsAPI(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      window._mapsInit = resolve;
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) +
        '&libraries=places&callback=_mapsInit';
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });
  }

  // ================================================================
  // MAP CONTROLLER
  // ================================================================

  function initMap() {
    $.mapLoading.classList.add('hidden');

    state.map = new google.maps.Map($.map, {
      center: CONFIG.defaultCenter,
      zoom: CONFIG.defaultZoom,
      styles: CONFIG.mapStyle,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    state.infoWindow = new google.maps.InfoWindow();
    state.streetViewService = new google.maps.StreetViewService();

    state.map.addListener('click', onMapClick);
    state.map.addListener('idle', debounce(onMapIdle, CONFIG.debounceMs));

    state.googleReady = true;

    // Render markers for existing restaurants
    state.restaurants.forEach(createMarker);

    // Try geolocation
    getUserLocation();
  }

  function createMarker(restaurant) {
    if (!state.map) return;

    // Remove existing marker for this restaurant
    const existing = state.markers.get(restaurant.id);
    if (existing) existing.setMap(null);

    const marker = new google.maps.Marker({
      position: { lat: restaurant.lat, lng: restaurant.lng },
      map: state.map,
      title: restaurant.name,
      animation: google.maps.Animation.DROP,
    });

    // Apply filter visibility — unrated restaurants always show
    if (restaurant.avgRating !== 0 && restaurant.avgRating < state.filterMinRating) {
      marker.setMap(null);
    }

    marker.addListener('click', () => onMarkerClick(restaurant.id, marker));
    state.markers.set(restaurant.id, marker);
  }

  function updateMarkers() {
    const threshold = state.filterMinRating;
    state.restaurants.forEach((r) => {
      const marker = state.markers.get(r.id);
      if (!marker) {
        createMarker(r);
        return;
      }
      marker.setMap(effectiveRating(r) >= threshold ? state.map : null);
    });
  }

  function panTo(lat, lng) {
    if (state.map) {
      state.map.panTo({ lat, lng });
      state.map.setZoom(15);
    }
  }

  function onMarkerClick(restaurantId, marker) {
    const restaurant = getRestaurantById(restaurantId);
    if (!restaurant) return;

    state.selectedRestaurantId = restaurantId;

    if (restaurant.source === 'places') {
      showPlacesInfoWindow(restaurant, marker);
    } else {
      openReviewPanel(restaurant);
    }
  }

  function showPlacesInfoWindow(place, marker) {
    const content =
      '<div style="padding:4px;max-width:220px;">' +
      '<strong>' + escapeHtml(place.name) + '</strong><br>' +
      (place.avgRating ? 'Rating: ' + place.avgRating.toFixed(1) + ' \u2605<br>' : '') +
      (place.vicinity ? escapeHtml(place.vicinity) + '<br>' : '') +
      '</div>';
    state.infoWindow.setContent(content);
    state.infoWindow.open(state.map, marker);
  }

  function reviewCountText(r) {
    if (r.isLocal) {
      const n = r.reviews.length;
      return n + ' review' + (n !== 1 ? 's' : '');
    }
    const n = r.totalRatings || r.reviews.length || 0;
    return n + ' rating' + (n !== 1 ? 's' : '');
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ================================================================
  // GEOLOCATION
  // ================================================================

  function getUserLocation() {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser', 'error');
      return;
    }

    // Show user at default position initially
    setUserMarker(CONFIG.defaultCenter.lat, CONFIG.defaultCenter.lng);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        state.userPosition = { lat, lng };
        setUserMarker(lat, lng);
        panTo(lat, lng);
        searchNearbyPlaces(lat, lng);
      },
      () => {
        // User denied or error — stay at default
        panTo(CONFIG.defaultCenter.lat, CONFIG.defaultCenter.lng);
        searchNearbyPlaces(CONFIG.defaultCenter.lat, CONFIG.defaultCenter.lng);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  function setUserMarker(lat, lng) {
    if (state.userMarker) {
      state.userMarker.setPosition({ lat, lng });
      return;
    }
    state.userMarker = new google.maps.Marker({
      position: { lat, lng },
      map: state.map,
      title: 'You are here',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      zIndex: 999,
    });
  }

  // ================================================================
  // PLACES INTEGRATION
  // ================================================================

  function getCacheKey(lat, lng) {
    return 'places_' + [Math.round(lat * 100) / 100, Math.round(lng * 100) / 100].join(',');
  }

  function getCachedResults(lat, lng) {
    try {
      const cached = sessionStorage.getItem(getCacheKey(lat, lng));
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts > CONFIG.cacheTTL) {
        sessionStorage.removeItem(getCacheKey(lat, lng));
        return null;
      }
      return parsed.data;
    } catch { return null; }
  }

  function setCachedResults(lat, lng, data) {
    try {
      sessionStorage.setItem(getCacheKey(lat, lng), JSON.stringify({ data, ts: Date.now() }));
    } catch { /* quota exceeded */ }
  }

  function searchNearbyPlaces(lat, lng) {
    if (!state.map || !window.google) return;

    const cached = getCachedResults(lat, lng);
    if (cached) {
      mergePlacesResults(cached);
      return;
    }

    const service = new google.maps.places.PlacesService(state.map);
    const request = {
      location: { lat, lng },
      radius: CONFIG.placesRadius,
      type: 'restaurant',
    };

    service.nearbySearch(request, (results, status) => {
      if (status === 'OK' && results) {
        setCachedResults(lat, lng, results);
        mergePlacesResults(results);
      } else if (status === 'ZERO_RESULTS') {
        setCachedResults(lat, lng, []);
      } else if (status === 'OVER_QUERY_LIMIT') {
        showNotification('Places API quota reached. Showing local data only.', 'error');
      } else {
        console.warn('Places nearbySearch status:', status);
      }
    });
  }

  function mergePlacesResults(places) {
    const existingNames = new Set(state.restaurants.map((r) => r.name.toLowerCase().trim()));

    places.forEach((p) => {
      if (existingNames.has(p.name.toLowerCase().trim())) return;

      const restaurant = {
        id: 'place_' + p.place_id,
        placeId: p.place_id,
        name: p.name,
        lat: p.geometry.location.lat(),
        lng: p.geometry.location.lng(),
        address: p.vicinity || '',
        avgRating: p.rating || 0,
        totalRatings: p.user_ratings_total || 0,
        priceLevel: p.price_level || null,
        vicinity: p.vicinity || '',
        source: 'places',
        isLocal: false,
        reviews: [],
      };

      state.restaurants.push(restaurant);
      existingNames.add(p.name.toLowerCase().trim());
      createMarker(restaurant);
    });

    renderSidebar();
  }

  // ================================================================
  // MAP EVENT HANDLERS
  // ================================================================

  function onMapClick(event) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    state.pendingLocation = { lat, lng };
    showAddModal(lat, lng);
  }

  function onMapIdle() {
    if (!state.userPosition) return;
    const center = state.map.getCenter();
    searchNearbyPlaces(center.lat(), center.lng());
  }

  // ================================================================
  // UI: SIDEBAR
  // ================================================================

  function renderAll() {
    renderSidebar();
    updateMarkers();
  }

  function renderSidebar() {
    renderRestaurantList();
    renderCount();
  }

  function renderRestaurantList() {
    const el = $.list;
    const filtered = getFilteredRestaurants();

    if (filtered.length === 0) {
      el.innerHTML = '<p class="hint" style="padding:1rem;text-align:center;">No restaurants match the filter. Try lowering the minimum rating.</p>';
      return;
    }

    el.innerHTML = '';
    filtered.forEach((restaurant) => {
      const card = createRestaurantCard(restaurant);
      el.appendChild(card);
    });
  }

  function renderCount() {
    const total = state.restaurants.length;
    const showing = getFilteredRestaurants().length;
    $.count.textContent = 'Showing ' + showing + ' of ' + total + ' restaurant' + (total !== 1 ? 's' : '');
  }

  function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', restaurant.name + ', rating ' + restaurant.avgRating.toFixed(1));

    if (state.selectedRestaurantId === restaurant.id) {
      card.classList.add('selected');
    }

    const stars = createStarDisplay(restaurant.avgRating);

    card.innerHTML =
      '<div class="restaurant-card-header">' +
        '<span class="restaurant-card-name">' + escapeHtml(restaurant.name) + '</span>' +
        '<span class="restaurant-card-rating">' +
          '<span>' + restaurant.avgRating.toFixed(1) + '</span>' +
          stars.outerHTML +
        '</span>' +
      '</div>' +
      '<div class="restaurant-card-meta">' +
        (restaurant.priceLevel ? '<span class="price-indicator">' + priceSymbols(restaurant.priceLevel) + '</span>' : '') +
        '<span>' + (restaurant.source === 'local' ? 'Local' : 'Nearby') + '</span>' +
      '</div>' +
      '<div class="restaurant-card-address">' + escapeHtml(restaurant.address || restaurant.vicinity || '') + '</div>' +
      '<div class="restaurant-card-reviews">' +
        reviewCountText(restaurant) +
      '</div>';

    card.addEventListener('click', () => {
      if (restaurant.isLocal) {
        openReviewPanel(restaurant);
      } else {
        const marker = state.markers.get(restaurant.id);
        if (marker) showPlacesInfoWindow(restaurant, marker);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    return card;
  }

  // ================================================================
  // UI: STAR RATING DISPLAY
  // ================================================================

  function createStarDisplay(rating, maxStars) {
    maxStars = maxStars || CONFIG.maxStars;
    const container = document.createElement('span');
    container.className = 'star-display';
    container.setAttribute('aria-label', rating.toFixed(1) + ' out of ' + maxStars + ' stars');
    const rounded = Math.round(rating);
    for (let i = 1; i <= maxStars; i++) {
      const star = document.createElement('span');
      star.textContent = '\u2605';
      star.className = i <= rounded ? 'star-filled' : 'star-empty';
      container.appendChild(star);
    }
    return container;
  }

  function createInteractiveStars(value, maxStars, onChange) {
    maxStars = maxStars || CONFIG.maxStars;
    const container = document.createElement('div');
    container.className = 'interactive-stars';
    container.setAttribute('role', 'radiogroup');

    for (let i = 1; i <= maxStars; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-btn' + (i <= value ? ' active' : '');
      btn.textContent = '\u2605';
      btn.setAttribute('aria-label', i + ' star' + (i !== 1 ? 's' : ''));
      btn.setAttribute('aria-checked', i <= value ? 'true' : 'false');
      btn.setAttribute('role', 'radio');
      btn.addEventListener('click', () => {
        onChange(i);
        container.querySelectorAll('.star-btn').forEach((b, idx) => {
          b.classList.toggle('active', idx < i);
          b.setAttribute('aria-checked', idx < i ? 'true' : 'false');
        });
      });
      container.appendChild(btn);
    }
    return container;
  }

  // ================================================================
  // UI: FILTER BAR
  // ================================================================

  function renderFilterBar() {
    const container = $.filterContainer;
    container.innerHTML = '';

    for (let i = 1; i <= CONFIG.maxStars; i++) {
      const btn = document.createElement('button');
      btn.className = 'star-filter-btn' + (i <= state.filterMinRating ? ' active' : '');
      btn.textContent = '\u2605';
      btn.setAttribute('aria-label', i + ' star' + (i !== 1 ? 's' : '') + ' minimum');
      btn.setAttribute('aria-pressed', i <= state.filterMinRating ? 'true' : 'false');
      btn.addEventListener('click', () => {
        state.filterMinRating = i;
        renderFilterBar();
        renderAll();
        $.filterValue.textContent = i;
      });
      container.appendChild(btn);
    }

    $.filterValue.textContent = state.filterMinRating;
  }

  // ================================================================
  // UI: REVIEW PANEL
  // ================================================================

  function openReviewPanel(restaurant) {
    state.selectedRestaurantId = restaurant.id;
    $.panelTitle.textContent = restaurant.name;
    renderPanelContent(restaurant);
    $.reviewPanel.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    $.panelClose.focus();
    closeSidebar(); // mobile: close sidebar when selecting

    renderSidebar(); // highlight selected card
  }

  function closeReviewPanel() {
    $.reviewPanel.classList.add('hidden');
    document.body.style.overflow = '';
    state.selectedRestaurantId = null;
    renderSidebar();
  }

  function renderPanelContent(restaurant) {
    const el = $.panelContent;
    const stars = createStarDisplay(restaurant.avgRating);

    let html =
      '<div class="panel-restaurant-name">' + escapeHtml(restaurant.name) + '</div>' +
      '<div class="panel-restaurant-meta">' +
        '<span>' + stars.outerHTML + ' <strong>' + restaurant.avgRating.toFixed(1) + '</strong></span>' +
        (restaurant.priceLevel ? '<span>' + priceSymbols(restaurant.priceLevel) + '</span>' : '') +
        (restaurant.totalRatings ? '<span>' + restaurant.totalRatings + ' ratings</span>' : '') +
      '</div>' +
      '<div class="panel-restaurant-meta">' +
        '<span>' + escapeHtml(restaurant.address || restaurant.vicinity || '') + '</span>' +
      '</div>';

    el.innerHTML = html;

    // Street View
    const svContainer = document.createElement('div');
    svContainer.id = 'street-view';
    el.appendChild(svContainer);
    setupStreetView(restaurant.lat, restaurant.lng, svContainer);

    // Reviews section
    const reviewsTitle = document.createElement('div');
    reviewsTitle.className = 'panel-section-title';
    reviewsTitle.textContent = 'Reviews (' + restaurant.reviews.length + ')';
    el.appendChild(reviewsTitle);

    const reviewsContainer = document.createElement('div');
    reviewsContainer.id = 'reviews-container';

    if (restaurant.reviews.length === 0) {
      reviewsContainer.innerHTML = '<div class="review-no-reviews">No reviews yet. Be the first!</div>';
    } else {
      restaurant.reviews.forEach((review) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        const reviewStars = createStarDisplay(review.rating);
        reviewCard.innerHTML =
          '<div class="review-header">' +
            '<span class="review-author">' + escapeHtml(review.author) + '</span>' +
            '<span class="review-date">' + formatDate(review.date) + '</span>' +
          '</div>' +
          '<div>' + reviewStars.outerHTML + '</div>' +
          '<div class="review-text">' + escapeHtml(review.text) + '</div>';
        reviewsContainer.appendChild(reviewCard);
      });
    }
    el.appendChild(reviewsContainer);

    // Add Review form
    const formArea = document.createElement('div');
    formArea.id = 'review-form-area';
    formArea.innerHTML =
      '<div class="panel-section-title">Add a Review</div>' +
      '<div class="form-group">' +
        '<label for="review-author">Your name</label>' +
        '<input type="text" id="review-author" placeholder="Your name" autocomplete="off">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="review-rating">Rating</label>' +
        '<div id="review-rating" class="interactive-stars" role="radiogroup" aria-label="Rating"></div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="review-text">Your review</label>' +
        '<textarea id="review-text" rows="3" placeholder="Share your experience..."></textarea>' +
      '</div>' +
      '<div class="form-actions">' +
        '<button type="button" class="btn btn-primary" id="submit-review-btn">Submit Review</button>' +
      '</div>' +
      '<p id="review-error" class="error-message hidden" role="alert"></p>';

    el.appendChild(formArea);

    // Wire up review form
    const ratingContainer = document.getElementById('review-rating');
    let reviewRating = 0;
    const ratingStars = createInteractiveStars(0, CONFIG.maxStars, (v) => { reviewRating = v; });
    ratingContainer.appendChild(ratingStars);

    document.getElementById('submit-review-btn').addEventListener('click', () => {
      const author = document.getElementById('review-author').value.trim();
      const text = document.getElementById('review-text').value.trim();
      const errorEl = document.getElementById('review-error');

      if (!author) { errorEl.textContent = 'Please enter your name'; errorEl.classList.remove('hidden'); return; }
      if (!reviewRating) { errorEl.textContent = 'Please select a rating'; errorEl.classList.remove('hidden'); return; }
      if (!text) { errorEl.textContent = 'Please write a review'; errorEl.classList.remove('hidden'); return; }

      errorEl.classList.add('hidden');
      addReviewToState(restaurant.id, { author, rating: reviewRating, text });
    });
  }

  // ================================================================
  // UI: STREET VIEW
  // ================================================================

  function setupStreetView(lat, lng, container) {
    if (!state.streetViewService) {
      container.innerHTML = '<div class="no-street-view">Street View unavailable</div>';
      return;
    }

    state.streetViewService.getPanorama(
      { location: { lat, lng }, radius: 50, preference: google.maps.StreetViewPreference.NEAREST },
      (data, status) => {
        if (status === 'OK' && data) {
          container.innerHTML = '<div id="street-view-pano"></div>';
          try {
            const panoEl = document.getElementById('street-view-pano');
            if (!panoEl) throw new Error('Panorama container not found');
            const panorama = new google.maps.StreetViewPanorama(panoEl, {
              navigationControl: false,
              addressControl: false,
              zoomControl: false,
              motionTracking: false,
              pov: { heading: 0, pitch: 0 },
              visible: true,
              linksControl: false,
              clickToGo: false,
              disableDefaultUI: true,
              fullscreenControl: false,
            });
            panorama.setPano(data.location.pano);
          } catch {
            container.innerHTML = '<div class="no-street-view">Street View unavailable</div>';
          }
        } else {
          container.innerHTML = '<div class="no-street-view">No Street View available for this location</div>';
        }
      }
    );
  }

  // ================================================================
  // UI: ADD RESTAURANT MODAL
  // ================================================================

  let addModalRating = 0;

  function showAddModal(lat, lng) {
    addModalRating = 0;
    $.addName.value = '';
    $.addAddress.value = '';
    $.addError.classList.add('hidden');
    $.addModal.classList.remove('hidden');

    // Render interactive rating
    $.addRatingContainer.innerHTML = '';
    const stars = createInteractiveStars(0, CONFIG.maxStars, (v) => { addModalRating = v; });
    $.addRatingContainer.appendChild(stars);

    // Store for form submission
    $.addForm._lat = lat;
    $.addForm._lng = lng;

    $.addName.focus();
  }

  function hideAddModal() {
    $.addModal.classList.add('hidden');
    $.addForm.reset();
    $.addError.classList.add('hidden');
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    const name = $.addName.value.trim();
    if (!name) {
      $.addError.textContent = 'Please enter a restaurant name';
      $.addError.classList.remove('hidden');
      return;
    }
    if (!addModalRating) {
      $.addError.textContent = 'Please select a rating';
      $.addError.classList.remove('hidden');
      return;
    }

    const restaurant = addRestaurantToState({
      name,
      lat: $.addForm._lat,
      lng: $.addForm._lng,
      address: $.addAddress.value.trim(),
      avgRating: addModalRating,
    });

    hideAddModal();
    showNotification('"' + restaurant.name + '" added!', 'success');
    openReviewPanel(restaurant);
  }

  // ================================================================
  // EVENT LISTENERS
  // ================================================================

  function initEventListeners() {
    // Review panel
    $.panelClose.addEventListener('click', closeReviewPanel);
    $.reviewPanel.querySelector('.panel-backdrop').addEventListener('click', closeReviewPanel);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$.reviewPanel.classList.contains('hidden')) closeReviewPanel();
        if (!$.addModal.classList.contains('hidden')) hideAddModal();
      }
    });

    // Add modal
    $.addForm.addEventListener('submit', handleAddSubmit);
    $.addCancelBtn.addEventListener('click', hideAddModal);
    $.addCloseBtn.addEventListener('click', hideAddModal);
    $.addModal.querySelector('.modal-backdrop').addEventListener('click', hideAddModal);

    // Locate me
    $.locateBtn.addEventListener('click', () => {
      if (state.userPosition) {
        panTo(state.userPosition.lat, state.userPosition.lng);
      } else {
        getUserLocation();
      }
    });

    // Sidebar toggle (mobile)
    $.sidebarToggle.addEventListener('click', toggleSidebar);
    $.sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  function toggleSidebar() {
    $.sidebar.classList.toggle('open');
    $.sidebarBackdrop.classList.toggle('hidden');
  }

  function closeSidebar() {
    $.sidebar.classList.remove('open');
    $.sidebarBackdrop.classList.add('hidden');
  }

  // ================================================================
  // INITIALIZATION
  // ================================================================

  async function init() {
    cacheElements();

    const apiKey = getApiKey();
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      $.mapLoading.textContent = 'Please set your Google Maps API key. See README.md for instructions.';
      showNotification('Google Maps API key not configured', 'error');
      return;
    }

    try {
      await loadGoogleMapsAPI(apiKey);
      await loadLocalRestaurants();
      initMap();
      renderFilterBar();
      initEventListeners();
    } catch (err) {
      console.error('Initialization error:', err);
      $.mapLoading.textContent = 'Failed to load. Check console for details.';
      showNotification('Failed to initialize: ' + err.message, 'error');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
