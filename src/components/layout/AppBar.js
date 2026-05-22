import React from 'react';
import MuiAppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import compass from '../../images/compass.svg';

const AppBar = () => (
  <MuiAppBar position="static">
    <Toolbar>
      <Typography color="inherit" style={{ flexGrow: 1 }}>
        Restaurants Review
      </Typography>
      <img
        src={compass}
        alt="Reload page"
        height="50"
        style={{ cursor: 'pointer' }}
        onClick={() => window.location.reload(false)}
      />
    </Toolbar>
  </MuiAppBar>
);

export default AppBar;
