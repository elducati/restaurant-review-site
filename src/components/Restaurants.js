import React, {useState, useEffect} from "react"
import axios from "axios"

const Restaurant = () => {
   const [restaurants, setRestaurants ] = useState([])
   const googleapiskey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY
   useEffect(() => {
    console.log('effect')
    
    axios
      .get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-1.289100,36.798141&radius=1500&type=restaurant&key=${googleapiskey}`)
      .then(response => {
        console.log('promise fulfilled')
        setRestaurants(response.data)
      })
  }, [])
}
export default Restaurant