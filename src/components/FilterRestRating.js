import React, { useContext } from "react"
import StarRatings from "react-star-ratings"
import Context from "../Context"

const FilterRestRating = () => {
    const { minRating, resetMinRating } = useContext(Context)
    const changeRating = (newRating) => {
        resetMinRating(newRating)
    }
    return (
        <div>
            <span>Rating</span>
            <StarRatings
                rating={minRating}
                starRatedColor="rgb(220,20,60)"
                starEmptyColor="rgb(203, 211, 227)"
                changeRating={changeRating}
                numberOfStars={5}
                name="rating"
                starDimension="30px"
            />
        </div>
    )
}
export default FilterRestRating