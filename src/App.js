import React, { useState, useCallback, useRef } from "react"
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { formatRelative } from "date-fns"
import mapStyles from "./mapStyles"
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

function App() {
  const libraries = ["places"]
  const mapContainerStyle = {
    width: "100vw",
    height: "100vh",
  }
  const center = {
    lat: -1.285790,
    lng: 36.820030,
  }
  const options = {
    styles: mapStyles,
    disableDefaultUi: true,
    zoomControl: true,
  }
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  })
  const [markers, setMarkers] = useState([])
  const [selected, setSelected] = useState(null)
  const onMapClick = useCallback((event) => {
    setMarkers((current) =>
      [...current, {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        time: new Date(),
      },
      ])
  }, [])
  const panTo = useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng })
    mapRef.current.setZoom(14)
  }, [])
  const mapRef = useRef()
  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])
  if (loadError) return "Error loading maps"
  if (!isLoaded) return "Loading Maps"
  return (
    <div>
      <h1>Map</h1>

      <Search panTo={panTo} />
      <Locate panTo={panTo} />
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.time.toISOString()}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => {
              setSelected(marker)
            }}
          />
        ))}
        {selected ? (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => {
              setSelected(null)
            }}
          >
            <div>
              <h2>Bear spotted</h2>
              <p>spotted {formatRelative(selected.time, new Date())}</p>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}
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
          },
          () => null
        );
      }}
    >
      <img src="/logo.svg" alt="compass" />
    </button>
  );
}
function Search(panTo) {
  const { ready, value, suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: {
        lat: () => -1.285790,
        lng: () => 36.820030
      },
      radius: 200 * 1000,
    }
  })
  return (
    <div className="search">
      <Combobox 
      onSelect={async (address) => {
        setValue(address, false)
        clearSuggestions()

        try {
          const results = await getGeocode({ address });
          const { lat, lng } = await getLatLng(results[0]);
          panTo({ lat, lng });
        } catch (error) {
          console.log("😱 Error: ", error);
        }
      }
    }
  >
    <ComboboxInput 
    value={value} onChange={(e)=>{
      setValue(e.target.value)
    }}
    disabled={!ready}
    placeholder="Enter an address"
    />
    <ComboboxPopover>
      <ComboboxList>
      {status === "OK" && data.map(({id, description}) => (
        <ComboboxOption key={id} value={description} />
      ))}
      </ComboboxList>
    </ComboboxPopover>
  </Combobox>
    </div>
  )
}
export default App;
