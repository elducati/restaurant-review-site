import Axios from "axios"
import React from "react"
import { Marker, InfoWindow } from "@react-google-maps/api"
import compass from "../compass.svg"
import { LocationContext } from "../context/locationContext"

const RestLocation = ({panTo}) => {
    //google maps api keys
    const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY

    const location = React.useContext(LocationContext)
    console.log(location);    
    const lat = location[0].lat
    const lng = location[0].lng
    console.log(lat);    
    const [responseData, setResponseData] = React.useState([])
    const [selected, setSelected] = React.useState(null)
    

    const onSelect = item => {
        setSelected(item);
    }
    React.useEffect(() => {        
        Axios
            .get(`https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&type=restaurant&key=${googleMapsApiKey}`)
            .then((response) => {
                setResponseData(response.data.results)
            })
            panTo({lat, lng})
    }, [googleMapsApiKey, lat, lng])
//show nearby restaurants using Markers
    return (
        <div>
            {responseData.map((item) => (
                <Marker
                    key={item.name}
                    position={item.geometry.location}
                    onClick={() => onSelect(item)}
                    icon={{
                        url: compass,
                        origin: new window.google.maps.Point(0, 0),
                        anchor: new window.google.maps.Point(15, 15),
                        scaledSize: new window.google.maps.Size(30, 30),
                    }}

                />

            ))}
            {/* display restaurant information on a marker */}
            {selected ? (
                <InfoWindow
                    position={selected.geometry.location}
                    clickable={true}
                    onCloseClick={() => {
                        setSelected(null);
                    }}
                >
                    <div>
                        <h2>
                            <span role="img" aria-label="restaurant">
                                {selected.name}
                            </span>                            
                        </h2>
                    </div>
                </InfoWindow>
            ) : null}

        </div>
    )
}
export default RestLocation