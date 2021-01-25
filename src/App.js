import React, { useState, createContext } from "react";
import Main from "./components/Main";

// Create Context Object
export const LocationContext = createContext();
// Create a provider for components to consume and subscribe to changes
export const App = (props) => {
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      //console.log(position.coords.latitude, position.coords.longitude)
    },
    () => null
  );
  return (
    <div>
      <LocationContext.Provider value={[location, setLocation]}>
        {props.children}
      </LocationContext.Provider>
      <Main />
    </div>
  )
}
export default App