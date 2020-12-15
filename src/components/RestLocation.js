import React from "react"
import { LocationContext } from "../context/locationContext"

const RestLocation = ({panTo}) => {
    //google maps api keys

    const location = React.useContext(LocationContext)
    //console.log(location);    
    const lat = location[0].lat
    const lng = location[0].lng
    //console.log(lat);   
      
    React.useEffect(() => {         
            panTo({lat, lng})
    }, [panTo, lat, lng])

    return (
        <div>
                      

        </div>
    )
}
export default RestLocation