import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: string;
}

export const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (requiredUserType && profile?.user_type !== requiredUserType) {
        // Redirect to correct dashboard based on user type
        switch (profile?.user_type) {
          case 'job_seeker':
            navigate('/dashboard/jobseeker');
            break;
          case 'company':
            navigate('/dashboard/company');
            break;
          case 'hr':
            navigate('/dashboard/hr');
            break;
          default:
            navigate('/');
        }
      }
    }
  }, [user, profile, loading, navigate, requiredUserType]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect happening
  }

  return <>{children}</>;
};