import React, { useState, createContext } from "react";

// Create Context Object
export const LocationContext = createContext();

// Create a provider for components to consume and subscribe to changes
export const CounterContextProvider = props => {
  const [location, setLocation] = useState({lat:0,lng:0});

  return (
    <LocationContext.Provider value={[location, setLocation]}>
      {props.children}
    </LocationContext.Provider>
  );
};