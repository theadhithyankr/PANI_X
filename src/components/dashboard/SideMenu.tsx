import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useSupabase';
import { useInboxContext } from '../../contexts/InboxContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
    LayoutDashboard, Briefcase, Mail, ClipboardList, User, LogOut, Sparkles,
    ChevronLeft, ChevronRight, Moon, Sun, Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ALL_ITEMS = [
    { text: 'Overview', icon: LayoutDashboard, path: '/candidate' },
    { text: 'AI Chat', icon: Sparkles, path: '/candidate/ai-chat' },
    { text: 'Find Jobs', icon: Briefcase, path: '/jobs' },
    { text: 'Inbox', icon: Mail, path: '/inbox', badge: true },
    { text: 'Applications', icon: ClipboardList, path: '/applications' },
    { text: 'Campaigns', icon: Calendar, path: '/campaigns' },
    { text: 'Profile', icon: User, path: '/profile' },
];

// Secondary-only items shown in mobile drawer (primary ones are in bottom nav)
const SECONDARY_ITEMS = [
    { text: 'AI Chat', icon: Sparkles, path: '/candidate/ai-chat', badge: false },
    { text: 'Inbox', icon: Mail, path: '/inbox', badge: true },
];

interface Props {
    collapsed?: boolean;
    onToggle?: () => void;
    mobileDrawer?: boolean;
}

export default function SideMenu({ collapsed = false, onToggle, mobileDrawer = false }: Props) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { profile } = useProfile();
    const { unreadCount } = useInboxContext();
    const { signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleSignOut = async () => {
        try { await signOut(); navigate('/signin'); } catch { navigate('/signin'); }
    };

    const items = mobileDrawer ? SECONDARY_ITEMS : ALL_ITEMS;

    return (
        <div className="flex h-full w-full flex-col justify-between">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Logo — hidden in mobile drawer (header has close btn, no logo needed) */}
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
                    {items.map(({ text, icon: Icon, path, badge }) => {
                        const isActive = pathname === path;
                        return (
                            <Button
                                key={text}
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={cn(
                                    'h-11 w-full',
                                    collapsed ? 'justify-center px-0' : 'justify-start px-3',
                                    isActive
                                        ? 'bg-secondary/50 font-bold text-foreground'
                                        : 'font-medium text-muted-foreground hover:text-foreground'
                                )}
                                onClick={() => navigate(path)}
                                title={collapsed ? text : undefined}
                            >
                                <Icon className={cn(
                                    'h-5 w-5 shrink-0',
                                    collapsed ? '' : 'mr-3',
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                )} />
                                {!collapsed && text}
                                {!collapsed && badge && unreadCount > 0 && (
                                    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Button>
                        );
                    })}
                </nav>
            </div>

            {/* User Footer */}
            <div className={cn('shrink-0 border-t border-border/60', collapsed ? 'p-2' : 'p-4')}>
                {collapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                            {profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Toggle theme" title="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Sign out" title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                            {profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {profile?.full_name || 'My Profile'}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {profile?.email || 'Loading...'}
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
