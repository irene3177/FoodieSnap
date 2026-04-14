import { UserListItem } from '../../types';
import './UserCard.css';

interface UserCardProps {
  user: UserListItem;
  onClick: () => void;
}

function UserCard({ user, onClick}: UserCardProps) {
  return (
    <div className="user-card" onClick={onClick}>
      <div className="user-card__avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={user.username} />
        ) : (
          <span>{user.username.charAt(0).toUpperCase() || 'U'}</span>
        )}
      </div>
      <div className="user-card__info">
        <h3 className="user-card__name">{user.username}</h3>
        {user.bio && 
        <p className="user-card__bio">
          {user.bio.slice(0, 80)}
        </p>}
        <div className="user-card__stats">
          <span className="user-card__stat">
            📚 {user.recipeCount || 0} recipes
          </span>
        </div>
      </div>
    </div>
  );
}

export default UserCard;