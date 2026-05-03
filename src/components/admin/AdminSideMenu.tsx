import {
    LayoutDashboard,
    Users,
    Briefcase,
    BarChart3,
    Settings,
    ShieldCheck,
    LogOut,
    Moon,
    Sun,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const menuItems = [
    { text: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { text: 'Users', icon: Users, path: '/admin/users' },
    { text: 'Job Listings', icon: Briefcase, path: '/admin/jobs' },
    { text: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { text: 'Settings', icon: Settings, path: '/admin/settings' },
    { text: 'Security', icon: ShieldCheck, path: '/admin/security' },
];

export default function AdminSideMenu() {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, signOut } = useAuth();

    const { theme, toggleTheme } = useTheme();

    const handleSignOut = async () => {
        await signOut();
        navigate('/signin');
    };

    return (
        <div className="flex h-full w-full flex-col justify-between bg-card text-card-foreground">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 p-6">
                    <img
                        src={theme === 'dark' ? '/pani-logo-dark.png' : '/pani-logo-light.png'}
                        alt="Pani"
                        className="h-8 w-auto object-contain"
                    />
                    <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Admin
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {menuItems.map((item) => {
                        const isSelected = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.text}
                                variant={isSelected ? 'secondary' : 'ghost'}
                                className={cn(
                                    'w-full justify-start h-11 px-4',
                                    isSelected
                                        ? 'bg-secondary/50 font-bold'
                                        : 'font-medium text-muted-foreground hover:text-foreground'
                                )}
                                onClick={() => navigate(item.path)}
                            >
                                <Icon
                                    className={cn(
                                        'mr-3 h-5 w-5',
                                        isSelected ? 'text-primary' : 'text-muted-foreground'
                                    )}
                                />
                                {item.text}
                            </Button>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 mt-auto">
                <div className="h-px w-full bg-border mb-4" />
                <div className="flex items-center gap-3 px-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="truncate text-sm font-semibold">
                            {profile?.full_name || 'Admin'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            {profile?.email || 'admin@pani.com'}
                        </span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        aria-label="Toggle theme" title="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        aria-label="Logout"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
