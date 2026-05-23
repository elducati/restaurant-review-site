var App = window.App || {};

App.CONFIG = {
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

App.state = {
  restaurants: [],
  map: null,
  markers: new Map(),
  infoWindow: null,
  userMarker: null,
  userPosition: null,
  selectedRestaurantId: null,
  filterMinRating: 1,
  streetViewService: null,
  googleReady: false,
};

App.utils = {
  debounce: function (fn, ms) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  },

  generateId: function () {
    return 'rest-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  },

  formatDate: function (dateStr) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  },

  priceSymbols: function (level) {
    if (!level) return '';
    return '\u00A3'.repeat(Math.min(level, 4));
  },

  getApiKey: function () {
    return window.GOOGLE_MAPS_API_KEY;
  },

  escapeHtml: function (str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  effectiveRating: function (r) {
    return r.avgRating || App.state.filterMinRating;
  },

  reviewCountText: function (r) {
    if (r.isLocal) {
      var n = r.reviews.length;
      return n + ' review' + (n !== 1 ? 's' : '');
    }
    var n = r.totalRatings || r.reviews.length || 0;
    return n + ' rating' + (n !== 1 ? 's' : '');
  },
};

App.data = {
  loadLocalRestaurants: async function () {
    try {
      var res = await fetch('restaurants.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      data.forEach(function (r) {
        r.source = 'local';
        r.isLocal = true;
        r.placeId = null;
      });
      App.state.restaurants = data;
    } catch (err) {
      console.error('Failed to load restaurants.json:', err);
      App.state.restaurants = [];
      App.ui.showNotification('Could not load restaurant data', 'error');
    }
  },

  getRestaurantById: function (id) {
    return App.state.restaurants.find(function (r) { return r.id === id; });
  },

  getFilteredRestaurants: function () {
    return App.state.restaurants.filter(function (r) {
      return App.utils.effectiveRating(r) >= App.state.filterMinRating;
    });
  },

  addRestaurant: function (data) {
    var restaurant = {
      id: App.utils.generateId(),
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
    App.state.restaurants.push(restaurant);
    App.ui.renderAll();
    App.map.createMarker(restaurant);
    return restaurant;
  },

  addReview: function (restaurantId, reviewData) {
    var restaurant = App.data.getRestaurantById(restaurantId);
    if (!restaurant) return;
    var review = {
      author: reviewData.author || 'Anonymous',
      rating: reviewData.rating,
      text: reviewData.text || '',
      date: new Date().toISOString().slice(0, 10),
    };
    restaurant.reviews.push(review);
    var total = restaurant.reviews.reduce(function (s, r) { return s + r.rating; }, 0);
    restaurant.avgRating = total / restaurant.reviews.length;
    App.ui.renderAll();
    if (App.state.selectedRestaurantId === restaurantId) {
      App.ui.renderPanelContent(restaurant);
    }
    App.ui.showNotification('Review added!', 'success');
  },

  removeRestaurant: function (id) {
    App.state.restaurants = App.state.restaurants.filter(function (r) { return r.id !== id; });
    var marker = App.state.markers.get(id);
    if (marker) { marker.setMap(null); App.state.markers.delete(id); }
    App.ui.renderAll();
  },
};
