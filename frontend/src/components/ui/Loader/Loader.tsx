interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

function Loader({ size = 'medium', message='Loading...' }: LoaderProps) {
  const sizeMap = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-14 h-14 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[200px] w-full animate-fade-in">
      <div className={`${sizeMap[size]} border rounded-full border-t-accent animate-spin`} />
      {message && <p className="mt-3 text-secondary text-sm text-center">{message}</p>}
    </div>
  );
}

export default Loader;