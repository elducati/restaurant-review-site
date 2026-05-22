"import React, { useContext } from 'react';
import { Paper, Card, CardContent } from '@material-ui/core';
import RestaurantContext from '../../contexts/RestaurantContext';
import RestaurantList from '../layout/RestaurantList';
import AddRestaurantForm from '../restaurant/AddRestaurantForm';
import FilterRating from '../restaurant/FilterRating';
import RestaurantCard from '../molecules/RestaurantCard';

const RestaurantSidebar = ({ nearbyRestaurants }) => {
  const { 
    addRestFlag, 
    minRating, 
    location 
  } = useContext(RestaurantContext);

  const filteredNearby = nearbyRestaurants.filter(place => place.rating >= minRating);

  return (
    <Paper elevation={3} style={{ padding: 10, height: '90vh', overflowY: 'auto' }}>
      <Card>
        <CardContent>
          <RestaurantList />
          {addRestFlag && <AddRestaurantForm />}
          {location && <FilterRating />}
          
          {filteredNearby.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Typography variant=\"h6\" gutterBottom>Nearby Results</Typography>
              {filteredNearby.map((place) => (
                <RestaurantCard 
                  key={place.place_id} 
                  name={place.name} 
                  rating={place.rating} 
                  icon={place.icon} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Paper>
  );
};

import { Typography } from '@material-ui/core';
export default RestaurantSidebar;"