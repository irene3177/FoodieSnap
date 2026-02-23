import './Favorites.css';

function Favorites() {
  return (
    <div className="favorites-page">
      <h1 className="favorites-page__title">My Favorite Recipes</h1>
      <p className="favorites-page__message">
        You haven't added any favorites yet.
        Start exploring recipes and click the heart icon to save them here!
      </p>
    </div>
  );
}

export default Favorites;