export const mapService = {
  panTo: (map, coords) => {
    if (!map) return;
    map.panTo(coords);
    map.setZoom(15);
  },

  nearbySearch: (map, coords, callback) => {
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: coords,
      radius: '500',
      type: ['restaurant'],
    };
    service.nearbySearch(request, callback);
  },

  getPlaceDetails: (service, placeId, callback) => {
    const detailRequest = {
      placeId: placeId,
      fields: ['name', 'formatted_address', 'geometry', 'rating', 'website', 'photos', 'reviews'],
    };
    service.getDetails(detailRequest, callback);
  },

  createInfoWindow: () => {
    return new window.google.maps.InfoWindow();
  },

  createMarker: (map, place, onClick) => {
    const marker = new window.google.maps.Marker({
      position: place.geometry.location,
      map,
      title: place.name,
    });
    window.google.maps.event.addListener(marker, 'click', onClick);
    return marker;
  }
};