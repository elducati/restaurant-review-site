import React, { useState, useCallback, useEffect } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import '@reach/combobox/styles.css';
import Grid from '@material-ui/core/Grid';
import { Card, CardContent, Paper, Typography } from '@material-ui/core';
import 'reactjs-popup/dist/index.css';

import useGoogleMaps from './hooks/useGoogleMaps';
import useRestaurants from './hooks/useRestaurants';
import RestaurantContext from './contexts/RestaurantContext';
import AppBar from './components/layout/AppBar';
import PlaceSearch from './components/search/PlaceSearch';
import RestaurantList from './components/layout/RestaurantList';
import AddRestaurantForm from './components/restaurant/AddRestaurantForm';
import FilterRating from './components/restaurant/FilterRating';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorMessage from './components/common/ErrorMessage';
import mapStyles from './styles/mapStyles';
import * as restaurantsData from './data/restaurants.json';
import compass from './images/compass.svg';
import restaurant from './images/restaurant.svg';

let service;
let currentInfoWindow;

const mapContainerStyle = {
  height: '70vh',
  width: '100vw',
};

const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};

const center = {
  lat: -1.2746752,
  lng: 36.8214016,
};

function App() {
  const { isLoaded, loadError, mapRef, onMapLoad } = useGoogleMaps();

  const {
    restaurants,
    setRestaurants,
    minRating,
    resetMinRating,
    addRestFlag,
    setAddRestFlag,
    addReviewFlag,
    setAddReviewFlag,
    lat,
    setLat,
    lng,
    setLng,
  } = useRestaurants();

  const [responseData, setResponseData] = useState([]);
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState();

  const panTo = useCallback(({ lat, lng }) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.panTo({ lat, lng });
    map.setZoom(15);

    const request = {
      location: { lat, lng },
      radius: '500',
      type: ['restaurant'],
    };
    currentInfoWindow = new window.google.maps.InfoWindow();
    service = new window.google.maps.places.PlacesService(map);

    const callback = (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        results.forEach((place) => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map,
            title: place.name,
          });
          window.google.maps.event.addListener(marker, 'click', () => {
            const detailRequest = {
              placeId: place.place_id,
              fields: [
                'name',
                'formatted_address',
                'geometry',
                'rating',
                'website',
                'photos',
                'reviews',
              ],
            };
            service.getDetails(detailRequest, (placeResult, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                const placeInfowindow = new window.google.maps.InfoWindow();
                let rating = 'None';
                if (placeResult.rating) rating = placeResult.rating;
                let firstPhoto = restaurant;
                try {
                  if (placeResult.photos[0]) {
                    firstPhoto = placeResult.photos[0].getUrl();
                  }
                } catch {
                  firstPhoto = restaurant;
                }
                placeInfowindow.setContent(
                  `<div><img src=${firstPhoto} style="width:100%;max-width:300px;height:300px;"/><br><strong>${placeResult.name}</strong><br>Rating:${rating} \u272e <br></div>`
                );
                placeInfowindow.open(marker.map, marker);
                currentInfoWindow.close();
                currentInfoWindow = placeInfowindow;
              }
            });
          });
        });
        setResponseData(results);
      }
    };
    service.nearbySearch(request, callback);
  }, [mapRef]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setRestaurants(restaurantsData.default);
        const { lat, lng } = location;
        panTo({ lat, lng });
      },
      () => null
    );
    // eslint-disable-next-line
  }, [panTo]);

  const onMapClick = useCallback((event) => {
    setAddRestFlag(true);
    const clickLat = event.latLng.lat();
    const clickLng = event.latLng.lng();
    setLat(clickLat);
    setLng(clickLng);
  }, [setAddRestFlag, setLat, setLng]);

  if (loadError) {
    return <ErrorMessage message="Error loading Google Maps" />;
  }

  if (!isLoaded) {
    return <LoadingSpinner message="Loading Google Maps..." />;
  }

  const locations = Array.from(responseData);

  return (
    <div>
      <AppBar />
      <PlaceSearch panTo={panTo} />
      <Grid container style={{ padding: 20 }}>
        <Grid container item xs={4} className="grid">
          <Grid padding={5}>
            <Paper elevation={3} style={{ padding: 10 }}>
              <Card>
                <CardContent>
                  <RestaurantContext.Provider
                    value={{
                      error: error,
                      setError: setError,
                      resetMinRating: resetMinRating,
                      minRating: minRating,
                      location: location,
                      addRestFlag: addRestFlag,
                      setAddRestFlag: setAddRestFlag,
                      addReviewFlag: addReviewFlag,
                      setAddReviewFlag: setAddReviewFlag,
                      lat: lat,
                      setlat: setLat,
                      lng: lng,
                      setLng: setLng,
                      restaurants: restaurants,
                      setRestaurants: setRestaurants,
                    }}
                  >
                    <RestaurantList />
                    {addRestFlag && <AddRestaurantForm />}
                    {location && <FilterRating />}
                  </RestaurantContext.Provider>

                  <Card>
                    {locations
                      .filter((place) => place.rating >= minRating)
                      .map((filteredPlace) => (
                        <Card variant="outlined" key={filteredPlace.place_id}>
                          <CardContent>
                            <Typography>
                              <img src={filteredPlace.icon} alt="icon" /> <br />
                              {filteredPlace.name} <br />
                              Rating: {filteredPlace.rating}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                  </Card>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        </Grid>

        <Grid container item xs={8}>
          <GoogleMap
            id="map"
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={center}
            options={options}
            onLoad={onMapLoad}
            onClick={onMapClick}
          >
            {restaurants.map((restu) => {
              if (restu.rating < minRating || !restu.rating) {
                return null;
              }
              return (
                <Marker
                  key={restu.place_id}
                  position={{
                    lat: lat,
                    lng: lng,
                  }}
                  onClick={() => {
                    setSelected(restu);
                  }}
                  icon={{
                    url: compass,
                    origin: new window.google.maps.Point(2, 2),
                    anchor: new window.google.maps.Point(15, 15),
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                />
              );
            })}
            {selected ? (
              <InfoWindow
                position={{
                  lat: selected.lat,
                  lng: selected.lng,
                }}
                onCloseClick={() => {
                  setSelected(null);
                }}
              >
                <div>
                  <img src={restaurant} alt="placeholder" />
                  <span>
                    <h2>{selected.name}</h2> {selected.rating} Star Rating.
                  </span>
                </div>
              </InfoWindow>
            ) : null}
          </GoogleMap>
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
