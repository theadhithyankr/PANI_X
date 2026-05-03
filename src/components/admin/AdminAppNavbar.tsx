import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import AdminSideMenu from './AdminSideMenu';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminAppNavbar() {
    const [open, setOpen] = useState(false);
    const { theme } = useTheme();

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-card border-b border-border/60 lg:hidden">
                <div className="flex items-center gap-2">
                    <img
                        src={theme === 'dark' ? '/pani-logo-dark.png' : '/pani-logo-light.png'}
                        alt="Pani"
                        className="h-7 w-auto object-contain"
                    />
                    <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Admin
                    </span>
                </div>
                <button
                    onClick={() => setOpen(true)}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </header>

            {open && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
                    <div className="relative z-10 w-72 h-full bg-card border-r border-border/60 flex flex-col">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <AdminSideMenu />
                    </div>
                </div>
            )}
        </>
    );
}
