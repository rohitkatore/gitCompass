import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-indigo-500 mb-4">
          404
        </div>
        
        <h1 className="text-xl font-semibold text-zinc-100 mb-2">Page Not Found</h1>
        <p className="text-sm text-zinc-500 mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button size="sm" icon={Home}>
              Go Home
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
