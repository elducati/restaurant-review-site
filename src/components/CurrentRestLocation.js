// import React, { useState } from "react"
// import { LocationContext } from "../context/locationContext"
// const CurrentRestLocation = ({ panTo }) => {
//     const [location, setLocation] = useState({ lat: 0, lng: 0 });
//     React.useEffect(() => {
//         navigator.geolocation.getCurrentPosition(
//             (position) => {
//                 setLocation({
//                     lat: position.coords.latitude,
//                     lng: position.coords.longitude,
//                 });
//                 //console.log(location)
//             },
//             () => null
//         );
//         //console.log(location);    
//         const lat = location.lat
//         const lng = location.lng
//         //console.log(lat);         

//         panTo({ lat, lng })
//     }, [panTo,location])
//     return (
//         <div>
//         </div>
//     )
// }
// export default CurrentRestLocation