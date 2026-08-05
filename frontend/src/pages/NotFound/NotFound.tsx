import { Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdHome } from 'react-icons/md';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8 bg-primary">
      <div className="text-center max-w-lg w-full p-8 md:p-12 bg-secondary rounded-2xl shadow-theme border ">
        {/* 404 */}
        <div className="text-7xl md:text-8xl font-extrabold bg-gradient-to-br from-accent to-accent-secondary bg-clip-text text-transparent leading-none mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-headline-md text-primary mb-3">Page Not Found</h1>
        <p className="text-secondary leading-relaxed mb-6">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border rounded-lg font-medium hover:bg-border hover:-translate-y-0.5 transition-all duration-300"
          >
            <MdArrowBack /> Go Back
          </button>
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-theme-lg transition-all duration-300">
            <MdHome /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;