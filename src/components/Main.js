//import depencies
import React, { useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import "@reach/combobox/styles.css";
import mapStyles from "../mapStyles";
import Search from "./Search";
import NavBar from "./AppBar";
import Grid from "@material-ui/core/Grid";
import { Card, CardContent, Paper, Typography } from "@material-ui/core";
import Context from "../Context";
import FilterRestRating from "./FilterRestRating";
import AddRest from "./AddRest";
import SideBar from "./SideBar";
import * as restaurantsData from "../restaurants.json";
import axios from "axios"
import restaurant from "../restaurant.svg"
import shortid from "shortid";

//initialize variables the map
let service;
let currentInfoWindow;
const libraries = ["places"];
//map's visible container layout size
const mapContainerStyle = {
  height: "100vh",
  width: "100vw",
};
//map options
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};
//default center
const center = {
  lat: -1.2746752,
  lng: 36.8214016,
};
//api key
const googleMapsApiKey = `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;

const Main = () => {
  //load the map, call the loadScript custom hook and the goople map keys
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  //useState hook
  const [responseData, setResponseData] = useState({});
  const [minRating, setMinRating] = useState(1);
  const [location, setLocation] = React.useState({ lat: 0, lng: 0 });
  const [addRestFlag, setAddRestFlag] = useState([]);
  const [addReviewFlag, setAddReviewFlag] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState();
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)

  //reset minimum rating declaration
  const resetMinRating = (newValue) => {
    setMinRating(newValue);
  };

  const searchApi = async (lati, lonn) => {
    const url = `url`;
    const request = await axios.get(url).catch((error) => {
      console.log("error!", error);
    });
    const response = request;
    if (response && response.status !== 200) {
      setError("Error fetching information");
    }
    if (response) {
      console.log("sss", restaurantsData.default);
      setRestaurants(...restaurants, response.data.results);
    }
  };


  const onMapClick = ((event, addRestFlag) => {
    console.log(event.latLng);
    setAddRestFlag(!addRestFlag);

    let lat = event.latLng.lat()
    let lng = event.latLng.lng()
    //set coordinates states on click
    setLat(lat);
    setLng(lng)

    console.log(
      "You clicked on the coordinates => lng: " + lng + " lat:" + lat
    );
  });

  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);
  // current position callback hook
  const panTo = useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(15);
    let map = mapRef.current;
    let request = {
      location: { lat, lng },
      radius: "500",
      type: ["restaurant"],
    };
    currentInfoWindow = new window.google.maps.InfoWindow();
    service = new window.google.maps.places.PlacesService(mapRef.current);

    // Handle the results (up to 20) of the Nearby Search
    const callback = (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        createMarkers(results);
        setResponseData(results);
      }
    };
    service.nearbySearch(request, callback);
    // Set markers at the location of each place result
    const createMarkers = (places) => {
      places.forEach((place) => {
        let marker = new window.google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: place.name,
        });
        // Add click listener to each marker
        window.google.maps.event.addListener(marker, "click", () => {
          let request = {
            placeId: place.place_id,
            fields: [
              "name",
              "formatted_address",
              "geometry",
              "rating",
              "website",
              "photos",
            ],
          };
          service.getDetails(request, (placeResult, status) => {
            showDetails(placeResult, marker, status);
          });
        });
      });
    };
    // Builds an InfoWindow to display details above the marker
    const showDetails = (placeResult, marker, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        let placeInfowindow = new window.google.maps.InfoWindow();
        let rating = "None";
        if (placeResult.rating) rating = placeResult.rating;
        let firstPhoto = "None";
        try {
          if (placeResult.photos[0]) {
            firstPhoto = placeResult.photos[0].getUrl();
          }
          else {
            firstPhoto = { restaurant }
          }
        } catch {
          console.error("error");
        }
        placeInfowindow.setContent(`<div><img src=${firstPhoto} 
        style="width:100%;max-width:300px;height:300px;"/><br><strong> 
        ${placeResult.name} 
          </strong><br>${placeResult.formatted_address}<br> Rating:   
          ${rating} \u272e 
          </div>`);
        placeInfowindow.open(marker.map, marker);
        currentInfoWindow.close();
        currentInfoWindow = placeInfowindow;
      } else {
        console.log("showDetails failed: " + status);
      }
    };
  }, []);
  const CurrentRestLocation = ({ panTo }) => {
    React.useEffect(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          searchApi(position.coords.latitude, position.coords.longitude);
          setRestaurants(restaurantsData.default);
          if (location) {
            searchApi();
          }
          const lat = location.lat;
          const lng = location.lng;
          //console.log(lat);
          panTo({ lat, lng });
        },
        () => null
      );
    }, [panTo]);
    return <div></div>;
  };
  const locations = Array.from(responseData);
  //load map
  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <NavBar />
      <Search panTo={panTo} />
      <Grid container style={{ padding: 20 }}>
        <Grid container item xs={4} className="grid">
          <Grid padding={5}>
            <Paper elevation={3} style={{ padding: 10 }}>
              <Card>
                <CardContent>
                  <Context.Provider
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
                    <SideBar />
                    {addRestFlag && <AddRest />}
                    {location && <FilterRestRating />}
                  </Context.Provider>
                  {locations &&
                    locations
                      .filter((place) => place.rating >= minRating)
                      .map((filteredPlace) => (
                        <Typography key={filteredPlace.place_id}>
                          {filteredPlace.name} <br />
                          Rating:
                          {filteredPlace.rating}
                        </Typography>
                      ))}
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
            {restaurants.map((restu, index) => {
              if (restu.rating < minRating || !restu.rating) {
                return null;
              } else {
                return (
                  <div>
                    <Marker
                      key={index}
                      position={{
                        lat: lat,
                        lng: lng,
                      }}
                      onClick={() => {
                        setSelected(restu);
                      }}
                      icon={{
                        url: restaurant,
                        origin: new window.google.maps.Point(2, 2),
                        anchor: new window.google.maps.Point(15, 15),
                        scaledSize: new window.google.maps.Size(30, 30),
                      }}
                    />
                    {selected ? (
                      <InfoWindow
                        position={{
                          lat: selected.lat,
                          lng: selected.lng,
                        }}
                        onCloseClick={()=>{
                          setSelected(null)
                        }}
                      >
                        <div>
                          <img src={restaurant} alt="placeholder" />
                          <span>
                            <h2>{selected.name}</h2>  {selected.rating} Star Rating.
                        </span>
                        </div>
                      </InfoWindow>
                    ) : null}
                  </div>
                );
              }
            })}
            <CurrentRestLocation panTo={panTo} />
          </GoogleMap>
        </Grid>
      </Grid>
    </div>
  );
};
export default Main;
