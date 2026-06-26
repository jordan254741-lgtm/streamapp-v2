import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Browse = lazy(() => import('./pages/Browse'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Requests = lazy(() => import('./pages/Requests'));
const Downloads = lazy(() => import('./pages/Downloads'));
const NotFound = lazy(() => import('./pages/NotFound'));

const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const Navbar = lazy(() => import('./components/layout/Navbar'));

const PageSkeleton = () => (
  <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
    <Skeleton className="h-8 w-48" />
  </div>
);

const RouteSkeleton = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/browse" replace />,
  },
  {
    path: '/login',
    element: (
      <RouteSkeleton>
        <ErrorBoundary>
          <Login />
        </ErrorBoundary>
      </RouteSkeleton>
    ),
  },
  {
    path: '/register',
    element: (
      <RouteSkeleton>
        <ErrorBoundary>
          <Register />
        </ErrorBoundary>
      </RouteSkeleton>
    ),
  },
  {
    path: '/browse',
    element: (
      <RouteSkeleton>
        <ErrorBoundary>
          <ProtectedRoute>
            <Navbar />
            <Browse />
          </ProtectedRoute>
        </ErrorBoundary>
      </RouteSkeleton>
    ),
  },
  {
    path: '/movie/:id',
    element: (
      <RouteSkeleton>
        <ErrorBoundary>
          <ProtectedRoute>
            <Navbar />
            <MovieDetail />
          </ProtectedRoute>
        </ErrorBoundary>
      </RouteSkeleton>
    ),
  },
  {
    path: '/requests',
    element: (
      <RouteSkeleton>
        <ErrorBoundary>
          <ProtectedRoute>
            <Navbar />
            <Requests />
          </ProtectedRoute>
        </ErrorBoundary>
      </RouteSkeleton>
    ),
  },
  {
    path: '/downloads',
    element: (
      <RouteSkeleton>
        <ErrorBoundary>
          <ProtectedRoute>
            <Navbar />
            <Downloads />
          </ProtectedRoute>
        </ErrorBoundary>
      </RouteSkeleton>
    ),
  },
  {
    path: '/404',
    element: (
      <RouteSkeleton>
        <ErrorBoundary>
          <NotFound />
        </ErrorBoundary>
      </RouteSkeleton>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
