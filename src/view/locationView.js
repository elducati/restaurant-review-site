import CurrentRestLocation from "../components/CurrentRestLocation"

const { App } = require("../App")

const LocationView = ({panTo}) => {
    return (
        <App>
           <CurrentRestLocation panTo={panTo}/>
        </App>
    )
}
export default LocationView