// import React from "react"
// import { LocationContext } from "../context/locationContext"

// const CurrentRestLocation = ({panTo}) => {
//     //google maps api keys
//     const [location, setLocation] = React.useState({lat:0, lng: 0});
//   navigator.geolocation.getCurrentPosition(
//     (position) => {
//       setLocation({
//         lat: position.coords.latitude,
//         lng: position.coords.longitude,
//       });
//       //console.log(position.coords.latitude, position.coords.longitude)
//     },
//     () => null
//   );
//     //console.log(location);    
//     const lat = location.lat
//     const lng = location.lng
//     //console.log(lat);         
//     React.useEffect(() => {         
//             panTo({lat, lng})
//     }, [panTo, lat, lng])
//     return (
//         <div>
//         </div>
//     )
// }
// export default CurrentRestLocation

