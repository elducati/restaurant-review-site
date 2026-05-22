import { useRef, useCallback } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

export default function useGoogleMaps() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const mapRef = useRef();

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  return { isLoaded, loadError, mapRef, onMapLoad };
}
