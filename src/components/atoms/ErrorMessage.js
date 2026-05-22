import React from 'react';

const ErrorMessage = ({ message }) => (
  <div role="alert" style={{ color: '#c00', padding: '1rem', textAlign: 'center' }}>
    {message}
  </div>
);

export default ErrorMessage;
