import React from 'react'
import StarRatings from "react-star-ratings";

//star rating and reviews
const IndividualReview = ({ photo, name, rating, text }) => {
    return (
        <div className="popupClass card">

            <div>
                <img
                    src={photo}
                    alt="Reviewer"
                    style={{ height: "100px" }}
                />
            </div>
            <div className="ReviewNameRating">
                <div><h2>{name}</h2></div>
                <div><h3>{text}</h3></div>
                <div> <StarRatings
                    rating={rating}
                    starRatedColor="rgb(220,20,60)"
                    starDimension="20px"
                />                </div>

            </div>
        </div>
    )
}

export default IndividualReview