import { useState } from 'react';
import EmployerSideMenu from './EmployerSideMenu';
import EmployerAppNavbar from './EmployerAppNavbar';
import MobileEmployerBottomNav from './MobileEmployerBottomNav';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem('employer-sidebar-collapsed') === 'true'; }
        catch { return false; }
    });

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem('employer-sidebar-collapsed', String(next)); } catch {}
            return next;
        });
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar — desktop only */}
            <aside className={`hidden lg:flex shrink-0 flex-col h-full bg-card border-r border-border transition-all duration-200 ${
                collapsed ? 'lg:w-[68px]' : 'lg:w-[280px]'
            }`}>
                <EmployerSideMenu collapsed={collapsed} onToggle={toggleCollapsed} />
            </aside>

            {/* Mobile top navbar */}
            <EmployerAppNavbar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 pb-16 lg:pb-0">
                <div className="max-w-[1600px] mx-auto px-4 py-4 lg:px-8 lg:py-8">
                    {children}
                </div>
            </main>

            {/* Mobile bottom navigation */}
            <MobileEmployerBottomNav />
        </div>
    );
}
