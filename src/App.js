//import depencies
import React,{useState, useCallback, useRef} from "react";
import {
  GoogleMap,
  useLoadScript, Marker, InfoWindow
} from "@react-google-maps/api";
import compass from "./compass.svg"
import "@reach/combobox/styles.css";
import mapStyles from "./mapStyles";
import Search from "./components/Search"
import LocationView from "./view/locationView";
import AppBar from "./components/AppBar";

let service;
const libraries = ["places"];
//map's visible container layout size
const mapContainerStyle = {
  height: "100vh",
  width: "85vw",
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

export default function App() {
  //load the map, call the loadScript custom hook and the goople map keys
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [markers, setMarkers] = useState([])
  const [selected, setSelected] = useState(null)
  const onMapClick = useCallback((e) => {
    setMarkers((current) => [
      ...current,
      {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);
  // current position callback hook
  const panTo = useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(15);
    let map = mapRef.current
    let request = {
      location: { lat, lng },
      radius: "500",
      type: ["restaurant"]
    }

    service = new window.google.maps.places.PlacesService(mapRef.current)
    // eslint-disable-next-line no-use-before-define
    service.nearbySearch(request, callback)
    function callback(results, status){
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        for (let i = 0; i < results.length; i++) {
          let place = results[i]
          new window.google.maps.Marker({
            position: place.geometry.location,
            map:map,
            title:place.name,
            icon:{url:compass,origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
              scaledSize: new window.google.maps.Size(30, 30),}
          })
        }
      }
    }
  }, []);
  //load map
  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <AppBar />
      <Search panTo={panTo} />
      <GoogleMap
        id="map"
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >        
        <LocationView panTo={panTo} />
      </GoogleMap>
    </div>
  );
}
