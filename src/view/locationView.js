import RestLocation from "../components/RestLocation"

const { LocationContextProvider } = require("../context/locationContext")

const LocationView = () => {
    return (
        <LocationContextProvider>
           <RestLocation />
        </LocationContextProvider>
    )
}
export default LocationView