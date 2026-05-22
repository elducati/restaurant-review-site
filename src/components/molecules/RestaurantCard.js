"import React from 'react';
import { Card, CardContent, Typography } from '@material-ui/core';

const RestaurantCard = ({ name, rating, icon, onClick }) => {
  return (
    <Card variant=\"outlined\" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', marginBottom: 10 }}>
      <CardContent>
        <Typography variant=\"body2\">
          <img src={icon} alt=\"restaurant icon\" style={{ width: 20, marginRight: 10 }} />
          <strong>{name}</strong>
          <br />
          Rating: {rating || 'N/A'} ★
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;"