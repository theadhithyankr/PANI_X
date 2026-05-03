import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, Users } from 'lucide-react';

const TABS = [
    { text: 'Dashboard',    icon: LayoutDashboard, path: '/employer' },
    { text: 'My Jobs',      icon: Briefcase,       path: '/employer/jobs' },
    { text: 'Applications', icon: FileText,        path: '/employer/applications' },
    { text: 'Candidates',   icon: Users,           path: '/employer/candidates' },
];

export default function MobileEmployerBottomNav() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/90 backdrop-blur-xl border-t border-border/40">
            <div className="flex items-center justify-around h-16 px-1">
                {TABS.map(({ text, icon: Icon, path }) => {
                    const isActive = pathname === path ||
                        (path !== '/employer' && pathname.startsWith(path));
                    return (
                        <button
                            key={text}
                            onClick={() => navigate(path)}
                            className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all ${
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                            <span className="text-[10px] font-medium leading-none">{text}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
