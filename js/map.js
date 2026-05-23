var App = window.App || {};

App.map = {
  init: function () {
    App.$.mapLoading.classList.add('hidden');

    App.state.map = new google.maps.Map(App.$.map, {
      center: App.CONFIG.defaultCenter,
      zoom: App.CONFIG.defaultZoom,
      styles: App.CONFIG.mapStyle,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    App.state.infoWindow = new google.maps.InfoWindow();
    App.state.streetViewService = new google.maps.StreetViewService();

    google.maps.event.addListener(App.state.map, 'click', App.map.onMapClick);
    google.maps.event.addListener(App.state.map, 'idle',
      App.utils.debounce(App.map.onMapIdle, App.CONFIG.debounceMs));

    App.state.googleReady = true;

    App.state.restaurants.forEach(App.map.createMarker);
    App.map.getUserLocation();
  },

  createMarker: function (restaurant) {
    if (!App.state.map) return;

    var existing = App.state.markers.get(restaurant.id);
    if (existing) existing.setMap(null);

    var marker = new google.maps.Marker({
      position: { lat: restaurant.lat, lng: restaurant.lng },
      map: App.state.map,
      title: restaurant.name,
      animation: google.maps.Animation.DROP,
    });

    if (restaurant.avgRating !== 0 && restaurant.avgRating < App.state.filterMinRating) {
      marker.setMap(null);
    }

    google.maps.event.addListener(marker, 'click', function () {
      App.map.onMarkerClick(restaurant.id, marker);
    });
    App.state.markers.set(restaurant.id, marker);
  },

  updateMarkers: function () {
    var threshold = App.state.filterMinRating;
    App.state.restaurants.forEach(function (r) {
      var marker = App.state.markers.get(r.id);
      if (!marker) {
        App.map.createMarker(r);
        return;
      }
      marker.setMap(App.utils.effectiveRating(r) >= threshold ? App.state.map : null);
    });
  },

  panTo: function (lat, lng) {
    if (App.state.map) {
      App.state.map.panTo({ lat: lat, lng: lng });
      App.state.map.setZoom(15);
    }
  },

  onMarkerClick: function (restaurantId, marker) {
    var restaurant = App.data.getRestaurantById(restaurantId);
    if (!restaurant) return;
    App.state.selectedRestaurantId = restaurantId;
    App.ui.openReviewPanel(restaurant);
  },

  getUserLocation: function () {
    if (!navigator.geolocation) {
      App.ui.showNotification('Geolocation is not supported by your browser', 'error');
      return;
    }

    App.map.setUserMarker(App.CONFIG.defaultCenter.lat, App.CONFIG.defaultCenter.lng);

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        App.state.userPosition = { lat: lat, lng: lng };
        App.map.setUserMarker(lat, lng);
        App.map.panTo(lat, lng);
        App.api.searchNearbyPlaces(lat, lng);
      },
      function () {
        App.map.panTo(App.CONFIG.defaultCenter.lat, App.CONFIG.defaultCenter.lng);
        App.api.searchNearbyPlaces(App.CONFIG.defaultCenter.lat, App.CONFIG.defaultCenter.lng);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  },

  setUserMarker: function (lat, lng) {
    if (App.state.userMarker) {
      App.state.userMarker.setPosition({ lat: lat, lng: lng });
      return;
    }
    App.state.userMarker = new google.maps.Marker({
      position: { lat: lat, lng: lng },
      map: App.state.map,
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
  },

  onMapClick: function (event) {
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();
    App.ui.showAddModal(lat, lng);
  },

  onMapIdle: function () {
    if (!App.state.userPosition) return;
    var center = App.state.map.getCenter();
    App.api.searchNearbyPlaces(center.lat(), center.lng());
  },
};
