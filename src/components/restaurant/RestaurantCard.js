import React, { useState } from 'react';
import StarRatings from 'react-star-ratings';
import Popup from 'reactjs-popup';
import { fetchPlaceDetails } from '../../api/places';
import ReviewItem from '../review/ReviewItem';
import ReviewForm from '../review/ReviewForm';
import restaurantImg from '../../images/restaurant.svg';
import 'reactjs-popup/dist/index.css';

const RestaurantCard = ({ name, imageSource, rating, placeId }) => {
  const [reviewResponse, setReviewResponse] = useState([]);

  const reviewFetch = async () => {
    if (!placeId) {
      setReviewResponse([]);
      return;
    }
    const data = await fetchPlaceDetails(placeId);
    if (data && data.result && data.result.photos != null) {
      setReviewResponse(data.result.reviews || []);
    }
  };

  const handleReviewSubmit = (reviewData) => {
    const newReview = {
      author_name: reviewData.author_name,
      rating: parseInt(reviewData.rating),
      text: reviewData.text,
      profile_photo_url: 'http://maps.google.com/mapfiles/kml/pal2/icon62.png',
    };
    setReviewResponse([...reviewResponse, newReview]);
  };

  return (
    <div className="card">
      <img
        src={restaurantImg}
        alt="restaurant"
        className="restaurant-image"
      />
      <div className="container">
        <h4 className="restaurant-title">{name}</h4>
        <StarRatings
          rating={rating}
          starRatedColor="rgb(220,20,60)"
          starDimension="20px"
        />
        <h2>
          <Popup
            trigger={
              <button className="button" onClick={reviewFetch}>
                review
              </button>
            }
            modal
            nested
          >
            {(close) => (
              <div className="reviewarea">
                <div className="header">
                  {name}
                  <Popup
                    trigger={(open) => (
                      <button className="button">
                        Add Review - {open ? 'Opened' : 'Closed'}
                      </button>
                    )}
                    position="right center"
                  >
                    <ReviewForm onSubmit={handleReviewSubmit} />
                  </Popup>
                </div>
                <div>
                  {reviewResponse.map((review, index) => (
                    <ReviewItem
                      key={review.author_name + (review.text || '') + index}
                      photo={review.profile_photo_url}
                      name={review.author_name}
                      rating={review.rating}
                      text={review.text}
                    />
                  ))}
                </div>
              </div>
            )}
          </Popup>
        </h2>
      </div>
    </div>
  );
};

export default RestaurantCard;
