import RestLocation from "../components/RestLocation"

const { LocationContextProvider } = require("../context/locationContext")

const LocationView = ({panTo}) => {
    return (
        <LocationContextProvider>
           <RestLocation panTo={panTo}/>
        </LocationContextProvider>
    )
}
export default LocationView