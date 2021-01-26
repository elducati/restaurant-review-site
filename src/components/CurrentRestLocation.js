import React from "react"
import { LocationContext } from "../context/locationContext"

const CurrentRestLocation = ({panTo}) => {    
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
export default CurrentRestLocation