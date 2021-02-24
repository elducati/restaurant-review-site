import React, { useEffect, useState } from "react";
import StarRatings from "react-star-ratings";
import Rating from "@material-ui/lab/Rating";
import Popup from "reactjs-popup";
import axios from "axios";
import IndividualReview from "./IndividualReview";

const RestaurantCard = ({ name, imageSource, rating, placeid }) => {
  const [reviewResponse, setReviewResponse] = useState([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [restImage, setRestImage] = useState("");
  let reviewDetails = [];

  const reviewFetch = async () => {
    if (placeid != null) {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeid}&key=AIzaSyAlELmqkRobpn26ReMLLTirp7GHsaW8vy0`;
      const request = await axios.get(url).catch((error) => {
        console.log("erre", error);
      });

      const response = request;

      if (response && response.status !== 200) {
      }
      if (response) {
        if (response.data.result.photos != null) {
          setRestImage(response.data.result.photos[0].photo_reference);
          setReviewResponse(response.data.result.reviews);
        }
      }
    } else {
      setReviewResponse([]);
    }
  };
  useEffect(() => {
    reviewFetch();
  }, [name]);

  const handleReviewSubmit = (
    e,
    reviewName,
    setReviewName,
    reviewRating,
    setReviewRating,
    reviewText
  ) => {
    e.preventDefault();
    if (reviewName !== "" && reviewText !== "" && reviewRating !== 0) {
      reviewDetails = {
        author_name: reviewName,
        rating: parseInt(reviewRating),
        text: reviewText,
        profile_photo_url:
          "https://maps.gstatic.com/mapfiles/place_api/icons/lodging-71.png",
      };
      setReviewName("");
      setReviewText("");
      setReviewRating("");
      setReviewResponse([...reviewResponse, reviewDetails]);
    }
  };
  return (
    <div className="card">
      <img
        src={`https://maps.googleapis.com/maps/api/place/photo?photoreference=${restImage}&sensor=false&maxheight=500&maxwidth=500&key=AIzaSyAlELmqkRobpn26ReMLLTirp7GHsaW8vy0`}
        alt="restaurant "
        className="restaurant-image"
      />
      <div className="container">
        <h4 className="restaurant-title">{name}</h4>
        <StarRatings
          rating={rating}
          starRatedColor="rgb(220,20,60)"
          starDimension="30px"
        />
        <h2>
          <Popup
            trigger={
              <button className="button" onClick={reviewFetch}>
                {" "}
                review{" "}
              </button>
            }
            modal
          >
            {(close) => (
              <div className="reviewarea">
                <a className="close" onClick={close}>
                  &times;
                </a>
                <div className="header">
                  {" "}
                  {name}
                  <Popup
                    trigger={<button className="button"> Add Review </button>}
                  >
                    <form
                      style={{ width: "auto" }}
                      onSubmit={(e) =>
                        handleReviewSubmit(
                          e,
                          reviewName,
                          setReviewName,
                          reviewRating,
                          setReviewRating,
                          reviewText
                        )
                      }
                    >
                      Name:
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                      />
                      <br />
                      Comment:
                      <input
                        type="text"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                      />
                      <br />
                      Rating:
                      <Rating
                        name="simple-controlled"
                        value={reviewRating}
                        onChange={(event, newValue) => {
                          if (newValue != null) {
                            setReviewRating(parseInt(newValue));
                          }
                        }}
                      />
                      <br />
                      <button>submit</button>
                    </form>
                  </Popup>
                </div>
                <div>
                  {reviewResponse.map((restu) => {
                    return (
                      <div>
                        <IndividualReview
                          photo={restu.profile_photo_url}
                          name={restu.author_name}
                          rating={restu.rating}
                          text={restu.text}
                        />
                      </div>
                    );
                  })}
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