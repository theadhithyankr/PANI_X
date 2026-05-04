import { useState, ReactNode } from 'react';
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import MobileBottomNav from '../components/dashboard/MobileBottomNav';
import { InboxProvider } from '../contexts/InboxContext';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem('candidate-sidebar-collapsed') === 'true'; }
        catch { return false; }
    });

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem('candidate-sidebar-collapsed', String(next)); } catch {}
            return next;
        });
    };

    return (
        <InboxProvider>
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Persistent sidebar — desktop only */}
            <aside className={`hidden md:flex shrink-0 flex-col h-full bg-card border-r border-border/60 transition-all duration-200 ${
                collapsed ? 'md:w-[68px]' : 'md:w-60'
            }`}>
                <SideMenu collapsed={collapsed} onToggle={toggleCollapsed} />
            </aside>

            {/* Mobile top navbar */}
            <AppNavbar />

            {/* Main scrollable area */}
            <main className="flex-1 overflow-y-auto pt-14 md:pt-0 pb-16 md:pb-0">
                <div className="max-w-[1600px] mx-auto px-4 py-4 md:px-6 md:py-8">
                    {children}
                </div>
            </main>

            {/* Mobile bottom navigation */}
            <MobileBottomNav />
        </div>
        </InboxProvider>
    );
}
