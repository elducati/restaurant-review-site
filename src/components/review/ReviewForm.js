import React, { useState } from 'react';
import Rating from '@material-ui/lab/Rating';

const ReviewForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !text || !rating) {
      return;
    }
    onSubmit({ author_name: name, rating, text });
    setName('');
    setText('');
    setRating(0);
  };

  return (
    <form style={{ width: 'auto' }} onSubmit={handleSubmit}>
      <label>
        Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <br />
      <label>
        Comment:
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <br />
      Rating:
      <Rating
        name="simple-controlled"
        size="small"
        value={rating}
        onChange={(event, newValue) => {
          if (newValue != null) {
            setRating(parseInt(newValue));
          }
        }}
      />
      <br />
      <button type="submit">submit</button>
    </form>
  );
};

export default ReviewForm;
