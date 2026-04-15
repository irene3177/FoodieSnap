import React from 'react';
import './OverlayLoader.css';

interface OverlayLoaderProps {
  message?: string;
}

const OverlayLoader: React.FC<OverlayLoaderProps> = ({ message = 'Checking authentication...' }) => {
  return (
    <div className="overlay-loader">
      <div className="overlay-loader__backdrop"></div>
      <div className="overlay-loader__content">
        <div className="overlay-loader__spinner"></div>
        <p className="overlay-loader__message">{message}</p>
      </div>
    </div>
  );
};

export default OverlayLoader;