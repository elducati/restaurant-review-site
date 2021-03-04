import React, { useContext } from "react";
import Context from "../Context";
import Card from "./Card";
import shortid from "shortid";

//render restaurants in sidebar
const SideBar = () => {
  const { restaurants, minRating } = useContext(Context);
  return (
    <div className="sidebar">
      {restaurants.map((restu) => {
        if (restu.rating < minRating || !restu.rating) {
          return null;
        } else {
          return (
            <Card
              key={shortid.generate()}
              name={restu.name}
              imageSource={restu.photos}
              rating={restu.rating}
              placeid={restu.place_id}
            />
          );
        }
      })}
    </div>
  );
};

export default SideBar;