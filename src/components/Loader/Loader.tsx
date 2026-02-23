import './Loader.css';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

function Loader({ size = 'medium', message='Loading...' }: LoaderProps) {
  const sizeClass = `loader--${size}`;

  return (
    <div className="loader-container">
      <div className={`loader ${sizeClass}`}>
        <div className="loader__spinner"></div>
      </div>
      {message && <p className="loader__message">{message}</p>}
    </div>
  );
}

export default Loader;