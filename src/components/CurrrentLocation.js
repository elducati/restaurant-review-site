import React from "react"
import compass from "../compass.svg"
//zoom to current position
const Locate = ({ panTo }) => {
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
        
        <img src={compass} alt="compass" />
      </button>
    );
  }
export default Locate  