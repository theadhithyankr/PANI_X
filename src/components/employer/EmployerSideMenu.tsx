import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Users,
    CalendarCheck,
    Building2,
    LogOut,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useSupabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const ALL_ITEMS = [
    { text: 'Dashboard',    icon: LayoutDashboard, path: '/employer' },
    { text: 'AI Chat',      icon: Sparkles,        path: '/employer/ai-chat' },
    { text: 'My Jobs',      icon: Briefcase,       path: '/employer/jobs' },
    { text: 'Applications', icon: FileText,        path: '/employer/applications' },
    { text: 'Candidates',   icon: Users,           path: '/employer/candidates' },
    { text: 'Interviews',   icon: CalendarCheck,   path: '/employer/interviews' },
    { text: 'Company',      icon: Building2,       path: '/employer/company' },
];

// Secondary-only items shown in mobile drawer (primary ones are in bottom nav)
const SECONDARY_ITEMS = [
    { text: 'AI Chat',    icon: Sparkles,      path: '/employer/ai-chat' },
    { text: 'Interviews', icon: CalendarCheck, path: '/employer/interviews' },
    { text: 'Company',    icon: Building2,     path: '/employer/company' },
];

interface Props {
    collapsed?: boolean;
    onToggle?: () => void;
    mobileDrawer?: boolean;
}

export default function EmployerSideMenu({ collapsed = false, onToggle, mobileDrawer = false }: Props) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { profile } = useProfile();
    const { signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleSignOut = async () => {
        try { await signOut(); navigate('/signin'); } catch { navigate('/signin'); }
    };

    const items = mobileDrawer ? SECONDARY_ITEMS : ALL_ITEMS;

    return (
        <div className="flex h-full w-full flex-col justify-between bg-card text-card-foreground overflow-hidden">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header — hidden in mobile drawer */}
                {!mobileDrawer && (
                    <div className={cn(
                        'flex items-center h-14 shrink-0 border-b border-border/60',
                        collapsed ? 'justify-center px-2' : 'justify-between px-5'
                    )}>
                        {!collapsed && (
                            <img
                                src={theme === 'dark' ? '/pani-logo-dark.png' : '/pani-logo-light.png'}
                                alt="Pani"
                                className="h-10 w-auto object-contain"
                            />
                        )}
                        <button
                            onClick={onToggle}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            title={collapsed ? 'Expand' : 'Collapse'}
                        >
                            {collapsed
                                ? <ChevronRight className="h-4 w-4" />
                                : <ChevronLeft className="h-4 w-4" />
                            }
                        </button>
                    </div>
                )}

                {/* Nav */}
                <nav className={cn('flex-1 py-3 space-y-0.5 overflow-y-auto', collapsed ? 'px-1.5' : 'px-3')}>
                    {items.map((item) => {
                        const isActive = pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.text}
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={cn(
                                    'h-11 w-full',
                                    collapsed ? 'justify-center px-0' : 'justify-start px-3',
                                    isActive
                                        ? 'bg-secondary/50 font-bold text-foreground'
                                        : 'font-medium text-muted-foreground hover:text-foreground'
                                )}
                                onClick={() => navigate(item.path)}
                                title={collapsed ? item.text : undefined}
                            >
                                <Icon className={cn(
                                    'h-5 w-5 shrink-0',
                                    collapsed ? '' : 'mr-3',
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                )} />
                                {!collapsed && item.text}
                            </Button>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className={cn('shrink-0 border-t border-border/60', collapsed ? 'p-2' : 'p-4')}>
                {collapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm overflow-hidden">
                            {profile?.logo_url
                                ? <img src={profile.logo_url} alt="logo" className="h-full w-full object-cover" />
                                : (profile?.full_name?.charAt(0).toUpperCase() || 'E')}
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Toggle theme"
                            title="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Sign out"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm overflow-hidden">
                            {profile?.logo_url
                                ? <img src={profile.logo_url} alt="logo" className="h-full w-full object-cover" />
                                : (profile?.full_name?.charAt(0).toUpperCase() || 'E')}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {profile?.company_name || profile?.full_name || 'Employer'}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {profile?.email || ''}
                            </span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Toggle theme"
                            title="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
