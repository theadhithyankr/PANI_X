import { useState, useEffect, useRef } from 'react';
import { Menu, X, Moon, Sun, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SideMenu from './SideMenu';
import { useTheme } from '../../contexts/ThemeContext';
import { useProfile } from '../../hooks/useSupabase';

const PAGE_NAMES: Record<string, string> = {
    '/candidate': 'Overview',
    '/candidate/ai-chat': 'AI Chat',
    '/jobs': 'Find Jobs',
    '/inbox': 'Inbox',
    '/applications': 'Applications',
    '/profile': 'Profile',
};

function getPageName(pathname: string) {
    if (pathname.startsWith('/applications/')) return 'Application';
    return PAGE_NAMES[pathname] || 'Pani';
}

export default function AppNavbar() {
    const [open, setOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { profile } = useProfile();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const lastScrollY = useRef(0);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const mainEl = document.querySelector('main');
        if (!mainEl) return;
        const onScroll = () => {
            const y = mainEl.scrollTop;
            if (y < 50) { setHidden(false); }
            else if (y < lastScrollY.current) { setHidden(false); }
            else { setHidden(true); }
            lastScrollY.current = y;
        };
        mainEl.addEventListener('scroll', onScroll, { passive: true });
        return () => mainEl.removeEventListener('scroll', onScroll);
    }, []);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const pageName = getPageName(pathname);

    return (
        <>
            {/* Mobile top bar */}
            <header className={`fixed top-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="flex items-center justify-between px-4 h-14 bg-card/90 backdrop-blur-xl border-b border-border/40">
                    {/* Page name */}
                    <span className="text-base font-bold text-foreground">{pageName}</span>

                    {/* Right actions */}
                    <div className="flex items-center gap-1">
                        {/* Inbox */}
                        <button
                            onClick={() => navigate('/inbox')}
                            className="relative h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                            aria-label="Inbox"
                        >
                            <Mail className="h-4.5 w-4.5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className="h-8 w-8 rounded-full ring-2 ring-violet-500/20 overflow-hidden shrink-0 focus:outline-none"
                            aria-label="Go to profile"
                        >
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-violet-500/15 flex items-center justify-center text-violet-400 font-bold text-xs">
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </button>

                        <button
                            onClick={() => setOpen(true)}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all ml-0.5"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile drawer — z-[60] to sit above AI assistant button (z-50) */}
            <div
                className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
                <div
                    className={`absolute top-0 right-0 h-full w-72 bg-card border-l border-border/40 shadow-2xl shadow-black/30 flex flex-col transition-transform duration-300 ease-out ${
                        open ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    {/* Drawer header — close button only, logo lives inside SideMenu */}
                    <div className="flex items-center justify-end px-4 h-14 border-b border-border/40">
                        <button
                            onClick={() => setOpen(false)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {/* Secondary nav items only on mobile */}
                    <SideMenu mobileDrawer />
                </div>
            </div>
        </>
    );
}
