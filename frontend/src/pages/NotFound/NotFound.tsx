import { Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdHome } from 'react-icons/md';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8 bg-primary">
      <div className="text-center max-w-lg w-full p-8 md:p-12 bg-secondary rounded-2xl shadow-theme border ">
        {/* 404 */}
        <div className="text-7xl md:text-8xl font-extrabold bg-gradient-to-br from-accent to-accent-secondary bg-clip-text text-transparent leading-none mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-headline-md text-secondary mb-3">Page Not Found</h1>
        <p className="text-secondary leading-relaxed mb-6">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => navigate(-1)} 
            className="btn-secondary"
          >
            <span className="flex gap-2 items-center">
              <MdArrowBack /> Go Back 
            </span>
          </button>
          <button className="btn-primary">
            <Link to="/">
              <span className="flex text- gap-2 items-center">
                <MdHome /> Go Home
              </span>
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;