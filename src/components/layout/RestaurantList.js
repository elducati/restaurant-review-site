import React, { useContext } from 'react';
import RestaurantContext from '../../contexts/RestaurantContext';
import RestaurantCard from '../restaurant/RestaurantCard';

const RestaurantList = () => {
  const { restaurants, minRating } = useContext(RestaurantContext);

  return (
    <div className="sidebar">
      {restaurants.map((restu) => {
        if (restu.rating < minRating || !restu.rating) {
          return null;
        }
        return (
          <RestaurantCard
            key={restu.place_id}
            name={restu.name}
            imageSource={restu.photos}
            rating={restu.rating}
            placeId={restu.place_id}
          />
        );
      })}
    </div>
  );
};

export default RestaurantList;
