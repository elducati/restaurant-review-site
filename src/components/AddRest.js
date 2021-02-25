import {useState, useContext, useEffect} from "react"
import Context from "../Context"
import Rating from "@material-ui/lab/Rating"
import  "../index.css"

const AddRest = () => {
    const { restaurants,setAddRestFlag, setRestaurants, tempCoords } = useContext(Context);
    const [restName, setRestName] = useState('')
    const [restRating, setRestRating] = useState(0)
    
    let restDetails = []
    
    useEffect(() => {        
        setAddRestFlag(true)
    }, [setAddRestFlag])
    const handleSubmit = (e, restName, restRating) => {
        e.preventDefault()
        restDetails = {
            name: restName,
            geometry: {
                location: {
                    lat: tempCoords,
                    lng: tempCoords
                },
            },
            place_id: null,
            rating: restRating,
            icon: "https://maps.google.com/mapfiles/kml/pal2/icon62.png"

        }        
        setRestaurants([...restaurants, restDetails])
        setAddRestFlag(false)
    }

    return (

        <div className="addrest">
            <h2>Add Restaurant </h2>
            <form onSubmit={(e) => handleSubmit(e, restName, restRating)}>
                <input type="text" value={restName} onChange={(e) => setRestName(e.target.value)} placeholder="name" />
                <Rating
                    name="simple-controlled"
                    value={restRating}
                    onChange={(event, newValue) => {
                        if (newValue != null) {
                            setRestRating(parseInt(newValue));
                        }
                    }}
                />
                <button>submit</button>
            </form>            
        </div>
    )
}

export default AddRest
