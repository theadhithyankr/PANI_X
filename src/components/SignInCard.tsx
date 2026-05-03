import * as React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

export default function SignInCard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const [forgotOpen, setForgotOpen] = React.useState(false);
    const [resetEmail, setResetEmail] = React.useState('');
    const [resetLoading, setResetLoading] = React.useState(false);
    const [resetSent, setResetSent] = React.useState(false);

    const handleForgotPassword = async () => {
        if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
            toast('Please enter a valid email address.', 'error');
            return;
        }
        setResetLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setResetLoading(false);
        if (error) {
            toast(error.message, 'error');
        } else {
            setResetSent(true);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (validateInputs()) {
            const email = (document.getElementById('email') as HTMLInputElement).value;
            const password = (document.getElementById('password') as HTMLInputElement).value;

            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            setLoading(false);

            if (error) {
                toast(error.message, 'error');
                setPasswordError(true);
                setPasswordErrorMessage('Invalid login credentials');
            } else if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    navigate('/admin');
                } else if (profile?.role === 'employer') {
                    navigate('/employer');
                } else {
                    navigate('/candidate');
                }
            }
        }
    };

    const validateInputs = () => {
        const email = document.getElementById('email') as HTMLInputElement;
        const password = document.getElementById('password') as HTMLInputElement;
        let isValid = true;

        if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage('');
        }

        if (!password.value || password.value.length < 6) {
            setPasswordError(true);
            setPasswordErrorMessage('Password must be at least 6 characters long.');
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage('');
        }

        return isValid;
    };

    return (
        <>
        <Card className="w-full sm:w-[450px] shadow-2xl bg-card/95 backdrop-blur border-border/50">
            <CardHeader className="space-y-4 pb-6">
                <CardTitle className="text-3xl text-center font-bold">Sign in</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className={emailError ? "text-destructive" : ""}>Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            autoComplete="email"
                            autoFocus
                            required
                            className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {emailError && <p className="text-xs text-destructive">{emailErrorMessage}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password" className={passwordError ? "text-destructive" : ""}>Password</Label>
                            <button
                                type="button"
                                onClick={() => { setForgotOpen(true); setResetSent(false); setResetEmail(''); }}
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                Forgot your password?
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••"
                                autoComplete="current-password"
                                required
                                className={passwordError ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                            />
                            <button
                                type="button"
                                onClick={handleClickShowPassword}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordError && <p className="text-xs text-destructive">{passwordErrorMessage}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <Label htmlFor="remember" className="font-normal text-muted-foreground">Remember me</Label>
                    </div>

                    <Button type="submit" className="w-full font-bold" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground mt-2">
                        Don&apos;t have an account?{' '}
                        <Link to="/signup" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <Button variant="outline" type="button" className="w-full" onClick={() => toast('Google sign-in coming soon!', 'info')}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </Button>
                </form>
            </CardContent>
        </Card>

            {/* Forgot Password Modal */}
            {forgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Reset Password</h2>
                            <button onClick={() => setForgotOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md" aria-label="Close">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {resetSent ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-foreground font-medium mb-2">Check your email</p>
                                <p className="text-sm text-muted-foreground mb-6">
                                    We sent a password reset link to <span className="text-foreground font-medium">{resetEmail}</span>.
                                </p>
                                <Button variant="outline" className="w-full" onClick={() => setForgotOpen(false)}>Done</Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Enter your email and we'll send you a link to reset your password.
                                </p>
                                <div className="space-y-2 mb-4">
                                    <Label htmlFor="reset-email">Email</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleForgotPassword(); }}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" className="flex-1" onClick={() => setForgotOpen(false)}>Cancel</Button>
                                    <Button className="flex-1" onClick={handleForgotPassword} disabled={resetLoading}>
                                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
