//import depencies
import React, { useState, useCallback, useRef } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import "@reach/combobox/styles.css";
import mapStyles from "../mapStyles";
import Search from "./Search";
import LocationView from "../view/locationView";
import NavBar from "./AppBar";
import Grid from "@material-ui/core/Grid";
import { Card, CardContent, Paper, Typography } from "@material-ui/core";
import CurrentRestLocation from "./CurrentRestLocation";
import Context from "../Context";
import FilterRestRating from "./FilterRestRating";

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

const Main = () => {
  //load the map, call the loadScript custom hook and the goople map keys
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [responseData, setResponseData] = useState({});
  const [minRating, setMinRating] = useState(1)
  
  const resetMinRating = (newValue) => {
    setMinRating(newValue)
  }

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
    }
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
    }
    // Builds an InfoWindow to display details above the marker
    const showDetails = (placeResult, marker, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        let placeInfowindow = new window.google.maps.InfoWindow();
        let rating = "None";
        if (placeResult.rating) rating = placeResult.rating;
        let firstPhoto = "None"
        try {
          if (placeResult.photos[0]) { firstPhoto = placeResult.photos[0].getUrl() }
        }
        catch {
          console.error("error");
        }
        placeInfowindow.setContent(`<div><img src=${firstPhoto} 
        style="width:100%;max-width:400px;height:auto;"/><br><strong> 
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
    }
  }, []);

  const locations = Array.from(responseData);
  //load map
  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <NavBar />
      <Search panTo={panTo} />
      <Grid container style={{ padding: 20 }}>
        <Grid container item xs={3}>
          <Grid padding={5}>
            <Paper elevation={3} style={{ padding: 10 }}>
              <Card>
                <CardContent>
                  {locations && locations.map((place) => {
                    return <Typography key={place.place_id}>
                      {place.name} <br />
                Rating:{place.rating}
                    </Typography>
                  })}
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        </Grid>
        <Grid container item xs={9} >
          <GoogleMap
            id="map"
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={center}
            options={options}
            onLoad={onMapLoad}
          >
            <CurrentRestLocation panTo={panTo} />
            <Context.Provider value={{resetMinRating:resetMinRating,minRating:minRating}}>
              <FilterRestRating />
            </Context.Provider>
          </GoogleMap>
        </Grid>
      </Grid>
    </div>
  );
}
export default Main
