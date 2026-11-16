import React from 'react';

interface OverlayLoaderProps {
  message?: string;
}

const OverlayLoader: React.FC<OverlayLoaderProps> = ({ message = 'Checking authentication...' }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 bg-secondary rounded-xl p-8 flex flex-col items-center gap-4 shadow-theme min-w-[200px]">
        <div className="w-10 h-10 border-3 border-t-accent rounded-full animate-spin" />
        <p className="text-primary text-sm m-0">{message}</p>
      </div>
    </div>
  );
};

export default OverlayLoader;