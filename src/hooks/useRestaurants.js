import { useState, useCallback } from 'react';

export default function useRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [minRating, setMinRating] = useState(1);
  const [addRestFlag, setAddRestFlag] = useState([]);
  const [addReviewFlag, setAddReviewFlag] = useState(false);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const resetMinRating = useCallback((newValue) => {
    setMinRating(newValue);
  }, []);

  return {
    restaurants,
    setRestaurants,
    minRating,
    setMinRating,
    resetMinRating,
    addRestFlag,
    setAddRestFlag,
    addReviewFlag,
    setAddReviewFlag,
    lat,
    setLat,
    lng,
    setLng,
  };
}
