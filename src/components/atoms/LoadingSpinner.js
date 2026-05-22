import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center' }}>
    {message}
  </div>
);

export default LoadingSpinner;
