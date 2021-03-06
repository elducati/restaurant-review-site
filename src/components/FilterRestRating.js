import {useContext} from "react"
import Context from "../contextApi/Context"
import StarRatings from "react-star-ratings"

//filter restaurants by ratings
const FilterRestRating = () => {
    const { minRating, resetMinRating } = useContext(Context);
    const changeRating = (newRating) => {
      resetMinRating(newRating);
    };
  
    return (
      <div className="filter-rating">
        <span className="rating-text">Filter by Rating</span>
        <StarRatings
          rating={minRating}
          starRatedColor="rgb(220,20,60)"
          starEmptyColor="rgb(203, 211, 227)"
          changeRating={changeRating}
          numberOfStars={5}
          name="rating"
          starDimension="20px"
        />
      </div>
    );
  };
  export default FilterRestRating