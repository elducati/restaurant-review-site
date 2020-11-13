import React from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import { formatRelative } from "date-fns";

import "@reach/combobox/styles.css";
import mapStyles from "./mapStyles";
import compass from "./compass.svg"

const libraries = ["places"];
const mapContainerStyle = {
  height: "100vh",
  width: "85vw",
};
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};
const center = {
  lat: 41.3851,
  lng: 2.1734,
};

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const onMapClick = React.useCallback((e) => {
    setMarkers((current) => [
      ...current,
      {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);
  // current position callback hook
  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, []);
  //load map
  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";
 //location object for restaurants
 const locations = [
  {
    name: "Location 1",
    location: { 
      lat: 41.3954,
      lng: 2.162 
    },
  },
  {
    name: "Location 2",
    location: { 
      lat: 41.3917,
      lng: 2.1649
    },
  },
  {
    name: "Location 3",
    location: { 
      lat: 41.3773,
      lng: 2.1585
    },
  },
  {
    name: "Location 4",
    location: { 
      lat: 41.3797,
      lng: 2.1682
    },
  },
  {
    name: "Location 5",
    location: { 
      lat: 41.4055,
      lng: 2.1915
    },
  }
];
  const onSelect = item => {
    setSelected(item);
  }
  return (
    <div>
      <h1>
        Restaurant{" "}
        <span role="img" aria-label="tent">
          ⛺️
        </span>
      </h1>

      <Locate panTo={panTo} />
      <Search panTo={panTo} />

      <GoogleMap
        id="map"
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {locations.map((item) => (
          <Marker
            key={item.name}
            position={item.location}
            onClick={()=>onSelect(item)}
            icon={{
              url: compass,
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
              scaledSize: new window.google.maps.Size(30, 30),
            }}
          />
        ))}
{/* //display restaurant information marker */}
        {selected ? (
          <InfoWindow
            position={selected.location}
            clickable ={true}
            onCloseClick={() => {
              setSelected(null);
            }}
          >
            <div>
              <h2>
                <span role="img" aria-label="restaurant">
                {selected.name}                  
                </span>{""}
                <p>restaurant</p>
              </h2>
              
              
            </div>
          </InfoWindow>
        ):null }
      </GoogleMap>
    </div>
  );
}
//display current position
function Locate({ panTo }) {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            console.log(position.coords.latitude, position.coords.longitude)
            
          },
          () => null
        );
      }}
    >
      <Marker panTo={panTo}/>
      <img src={compass} alt="compass" />
    </button>
  );
}
//search a place using the autocomplete functionality
function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 43.6532, lng: () => -79.3832 },
      radius: 100 * 1000,
    },
  });

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      panTo({ lat, lng });
    } catch (error) {
      console.log("😱 Error: ", error);
    }
  };

  return (
    <div className="search">
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Search your location"
        />
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}
