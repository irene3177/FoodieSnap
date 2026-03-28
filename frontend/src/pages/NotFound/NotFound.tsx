import { Link, useNavigate } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <div className="not-found__content">
        <div className="not-found__code">404</div>
        <h1 className="not-found__title">Page Not Found</h1>
        <p className="not-found__message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found__actions">
          <button 
            onClick={() => navigate(-1)} 
            className="not-found__button not-found__button--secondary"
          >
            ← Go Back
          </button>
          <Link to="/" className="not-found__button not-found__button--primary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;