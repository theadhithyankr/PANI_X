import AdminSideMenu from './AdminSideMenu';
import AdminAppNavbar from './AdminAppNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
            {/* Sidebar — desktop only */}
            <aside className="hidden lg:flex lg:w-[280px] lg:shrink-0 border-r border-border bg-card">
                <AdminSideMenu />
            </aside>

            {/* Mobile top navbar */}
            <AdminAppNavbar />

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto pt-20 lg:pt-8">
                {children}
            </main>
        </div>
    );
}
