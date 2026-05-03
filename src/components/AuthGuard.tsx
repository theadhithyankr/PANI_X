import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: 'employer' | 'candidate' | 'admin';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/signin');
            } else if (profile && requiredRole && profile.role !== requiredRole) {
                if (profile.role === 'admin') {
                    navigate('/admin');
                } else if (profile.role === 'employer') {
                    navigate('/employer');
                } else {
                    navigate('/candidate');
                }
            }
        }
    }, [user, profile, loading, requiredRole, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;
    if (requiredRole && profile?.role !== requiredRole) return null;

    return <>{children}</>;
}
