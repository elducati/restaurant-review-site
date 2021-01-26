import React from "react";
import Main from "./components/Main";


const { LocationContextProvider } = require("./context/locationContext")

const App = () => {
    return (
        <LocationContextProvider>           
           <Main />
        </LocationContextProvider>
    )
}
export default App