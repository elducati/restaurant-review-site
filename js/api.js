var App = window.App || {};

App.api = {
  loadGoogleMapsAPI: function (apiKey) {
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      window._mapsInit = resolve;
      var script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) +
        '&libraries=places&callback=_mapsInit';
      script.async = true;
      script.defer = true;
      script.onerror = function () { reject(new Error('Failed to load Google Maps API')); };
      document.head.appendChild(script);
    });
  },

  getCacheKey: function (lat, lng) {
    var key = [Math.round(lat * 100) / 100, Math.round(lng * 100) / 100].join(',');
    return 'places_' + key;
  },

  getCachedResults: function (lat, lng) {
    try {
      var cached = sessionStorage.getItem(App.api.getCacheKey(lat, lng));
      if (!cached) return null;
      var parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts > App.CONFIG.cacheTTL) {
        sessionStorage.removeItem(App.api.getCacheKey(lat, lng));
        return null;
      }
      return parsed.data;
    } catch (e) { return null; }
  },

  setCachedResults: function (lat, lng, data) {
    try {
      sessionStorage.setItem(App.api.getCacheKey(lat, lng),
        JSON.stringify({ data: data, ts: Date.now() }));
    } catch (e) { /* quota exceeded */ }
  },

  searchNearbyPlaces: function (lat, lng) {
    if (!App.state.map || !window.google) return;

    var cached = App.api.getCachedResults(lat, lng);
    if (cached) {
      App.api.mergePlacesResults(cached);
      return;
    }

    var service = new google.maps.places.PlacesService(App.state.map);
    var request = {
      location: { lat: lat, lng: lng },
      radius: App.CONFIG.placesRadius,
      type: 'restaurant',
    };

    service.nearbySearch(request, function (results, status) {
      if (status === 'OK' && results) {
        App.api.setCachedResults(lat, lng, results);
        App.api.mergePlacesResults(results);
      } else if (status === 'ZERO_RESULTS') {
        App.api.setCachedResults(lat, lng, []);
      } else if (status === 'OVER_QUERY_LIMIT') {
        App.ui.showNotification('Places API quota reached. Showing local data only.', 'error');
      } else {
        console.warn('Places nearbySearch status:', status);
      }
    });
  },

  mergePlacesResults: function (places) {
    var existingNames = new Set(App.state.restaurants.map(function (r) {
      return r.name.toLowerCase().trim();
    }));

    places.forEach(function (p) {
      if (existingNames.has(p.name.toLowerCase().trim())) return;

      var restaurant = {
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

      App.state.restaurants.push(restaurant);
      existingNames.add(p.name.toLowerCase().trim());
      App.map.createMarker(restaurant);
    });

    App.ui.renderSidebar();
  },

  setupStreetView: function (lat, lng, container) {
    if (!App.state.streetViewService) {
      container.innerHTML = '<div class="no-street-view">Street View unavailable</div>';
      return;
    }

    App.state.streetViewService.getPanorama(
      { location: { lat: lat, lng: lng }, radius: 50, preference: google.maps.StreetViewPreference.NEAREST },
      function (data, status) {
        if (status === 'OK' && data) {
          container.innerHTML = '<div id="street-view-pano"></div>';
          try {
            var panoEl = document.getElementById('street-view-pano');
            if (!panoEl) throw new Error('Panorama container not found');
            var panorama = new google.maps.StreetViewPanorama(panoEl, {
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
          } catch (e) {
            container.innerHTML = '<div class="no-street-view">Street View unavailable</div>';
          }
        } else {
          container.innerHTML = '<div class="no-street-view">No Street View available for this location</div>';
        }
      }
    );
  },
};
