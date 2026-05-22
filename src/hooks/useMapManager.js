import { useState, useCallback } from 'react';
import { mapService } from '../services/mapService';

export default function useMapManager(mapRef) {
  const [responseData, setResponseData] = useState([]);
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [error, setError] = useState(null);

  const panAndSearch = useCallback(({ lat, lng }) => {
    const map = mapRef.current;
    if (!map) return;

    setLocation({ lat, lng });
    mapService.panTo(map, { lat, lng });

    mapService.nearbySearch(map, { lat, lng }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setResponseData(results);
      } else {
        setError('Failed to fetch nearby restaurants');
      }
    });
  }, [mapRef]);

  return {
    responseData,
    location,
    error,
    setError,
    panAndSearch,
  };
}
"