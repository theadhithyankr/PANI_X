import { Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateAIChat from './pages/CandidateAIChat';
import FindJobs from './pages/FindJobs';
import Profile from './pages/Profile';
import Inbox from './pages/Inbox';
import Applications from './pages/Applications';
import ApplicationDetails from './pages/ApplicationDetails';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import EmployerJobs from './pages/employer/EmployerJobs';
import EmployerCandidates from './pages/employer/EmployerCandidates';
import EmployerCandidateProfile from './pages/employer/EmployerCandidateProfile';
import EmployerInterviews from './pages/employer/EmployerInterviews';
import EmployerCompany from './pages/employer/EmployerCompany';
import EmployerApplications from './pages/employer/EmployerApplications';
import EmployerAIChat from './pages/employer/EmployerAIChat';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminJobs from './pages/admin/AdminJobs';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSecurity from './pages/admin/AdminSecurity';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PageContextProvider } from './contexts/PageContext';
import AuthGuard from './components/AuthGuard';
import AIAssistant from './components/AIAssistant';
import ThemeToggle from './components/ui/theme-toggle';

const PUBLIC_PATHS = ['/', '/signin', '/signup', '/reset-password'];

function PublicThemeToggle() {
    const { pathname } = useLocation();
    if (!PUBLIC_PATHS.includes(pathname)) return null;
    return <ThemeToggle />;
}

function App() {
    return (
        <ThemeProvider>
        <ToastProvider>
        <AuthProvider>
        <PageContextProvider>
            <>
            <PublicThemeToggle />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Candidate Routes */}
                <Route path="/candidate" element={<AuthGuard requiredRole="candidate"><CandidateDashboard /></AuthGuard>} />
                <Route path="/candidate/ai-chat" element={<AuthGuard requiredRole="candidate"><CandidateAIChat /></AuthGuard>} />
                <Route path="/jobs" element={<AuthGuard requiredRole="candidate"><FindJobs /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard requiredRole="candidate"><Profile /></AuthGuard>} />
                <Route path="/inbox" element={<AuthGuard requiredRole="candidate"><Inbox /></AuthGuard>} />
                <Route path="/applications" element={<AuthGuard requiredRole="candidate"><Applications /></AuthGuard>} />
                <Route path="/applications/:id" element={<AuthGuard requiredRole="candidate"><ApplicationDetails /></AuthGuard>} />

                {/* Employer Routes */}
                <Route path="/employer" element={<AuthGuard requiredRole="employer"><EmployerDashboard /></AuthGuard>} />
                <Route path="/employer/ai-chat" element={<AuthGuard requiredRole="employer"><EmployerAIChat /></AuthGuard>} />
                <Route path="/employer/jobs" element={<AuthGuard requiredRole="employer"><EmployerJobs /></AuthGuard>} />
                <Route path="/employer/candidates" element={<AuthGuard requiredRole="employer"><EmployerCandidates /></AuthGuard>} />
                <Route path="/employer/candidates/:id" element={<AuthGuard requiredRole="employer"><EmployerCandidateProfile /></AuthGuard>} />
                <Route path="/employer/applications" element={<AuthGuard requiredRole="employer"><EmployerApplications /></AuthGuard>} />
                <Route path="/employer/interviews" element={<AuthGuard requiredRole="employer"><EmployerInterviews /></AuthGuard>} />
                <Route path="/employer/company" element={<AuthGuard requiredRole="employer"><EmployerCompany /></AuthGuard>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AuthGuard requiredRole="admin"><AdminDashboard /></AuthGuard>} />
                <Route path="/admin/users" element={<AuthGuard requiredRole="admin"><AdminUsers /></AuthGuard>} />
                <Route path="/admin/jobs" element={<AuthGuard requiredRole="admin"><AdminJobs /></AuthGuard>} />
                <Route path="/admin/analytics" element={<AuthGuard requiredRole="admin"><AdminAnalytics /></AuthGuard>} />
                <Route path="/admin/settings" element={<AuthGuard requiredRole="admin"><AdminSettings /></AuthGuard>} />
                <Route path="/admin/security" element={<AuthGuard requiredRole="admin"><AdminSecurity /></AuthGuard>} />
            </Routes>
            <AIAssistant />
            </>
        </PageContextProvider>
        </AuthProvider>
        </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
