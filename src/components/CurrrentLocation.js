import React, {useContext} from "react"
import compass from "../compass.svg"
import { LocationContext } from "../context/locationContext"
//zoom to current position

const Locate = () => {
  const panTo = useContext(LocationContext)
    return (
      <button
        className="locate"
        onClick={panTo}
      >
        
        <img src={compass} alt="compass" />
      </button>
    );
  }
export default Locate  