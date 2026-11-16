import React from 'react';
import './ProfileSkeleton.css';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="skeleton-profile">
      {/* Profile Header */}
      <div className="skeleton-profile__header">
        <div className="skeleton-profile__avatar"></div>
        <div className="skeleton-profile__username"></div>
        <div className="skeleton-profile__bio"></div>
        
        {/* Stats */}
        <div className="skeleton-profile__stats">
          <div className="skeleton-profile__stat"></div>
          <div className="skeleton-profile__stat"></div>
          <div className="skeleton-profile__stat"></div>
        </div>
        
        {/* Actions */}
        <div className="skeleton-profile__actions">
          <div className="skeleton-profile__button"></div>
          <div className="skeleton-profile__button"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="skeleton-profile__tabs">
        <div className="skeleton-profile__tab"></div>
        <div className="skeleton-profile__tab"></div>
        <div className="skeleton-profile__tab"></div>
      </div>

      {/* Content Grid */}
      <div className="skeleton-profile__grid">
        <div className="skeleton-profile__card"></div>
        <div className="skeleton-profile__card"></div>
        <div className="skeleton-profile__card"></div>
      </div>
    </div>
  );
};