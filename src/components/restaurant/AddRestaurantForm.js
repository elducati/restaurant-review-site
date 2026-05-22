import { useState, useContext, useEffect } from 'react';
import Rating from '@material-ui/lab/Rating';
import shortid from 'shortid';
import RestaurantContext from '../../contexts/RestaurantContext';

const AddRestaurantForm = () => {
  const { restaurants, setAddRestFlag, setRestaurants, lat, lng } =
    useContext(RestaurantContext);
  const [restName, setRestName] = useState('');
  const [restRating, setRestRating] = useState(0);

  useEffect(() => {
    setAddRestFlag(true);
  }, [setAddRestFlag]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const restDetails = {
      name: restName,
      lat,
      lng,
      place_id: shortid.generate(),
      rating: restRating,
      icon: 'https://maps.google.com/mapfiles/kml/pal2/icon62.png',
    };
    setRestaurants([...restaurants, restDetails]);
    setAddRestFlag(false);
  };

  return (
    <div className="addrest">
      <h2>Add Restaurant</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={restName}
          onChange={(e) => setRestName(e.target.value)}
          placeholder="name"
        />
        <Rating
          name="simple-controlled"
          value={restRating}
          onChange={(event, newValue) => {
            if (newValue != null) {
              setRestRating(parseInt(newValue));
            }
          }}
        />
        <button type="submit">submit</button>
      </form>
    </div>
  );
};

export default AddRestaurantForm;
