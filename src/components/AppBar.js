import React from "react"
import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"
import compass from "../compass.svg"

const NavBar = () => {
    return (
        <div>
            <AppBar position="static">
                <Toolbar>
                    <Typography color="inherit">
                        Restaurants Review
                    </Typography>
                    <img src={compass} alt="Current Location" height="50" style={{ float: "right", cursor: "pointer" }} onClick={() => window.location.reload(false)} />
                </Toolbar>
            </AppBar>

        </div>
    )
}
export default NavBar