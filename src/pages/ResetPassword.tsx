import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const toast = useToast();
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [sessionReady, setSessionReady] = React.useState(false);

    React.useEffect(() => {
        // Supabase puts the recovery token in the URL hash; onAuthStateChange fires PASSWORD_RECOVERY
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setSessionReady(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast('Password must be at least 6 characters.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            toast('Passwords do not match.', 'error');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (error) {
            toast(error.message, 'error');
        } else {
            toast('Password updated successfully!', 'success');
            navigate('/signin');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 60% 20%, hsl(var(--primary)/0.15) 0%, transparent 60%)' }}
            />
            <Card className="w-full sm:w-[420px] shadow-2xl bg-card/95 backdrop-blur border-border/50 relative z-10">
                <CardHeader className="space-y-2 pb-6">
                    <CardTitle className="text-2xl text-center font-bold">Set New Password</CardTitle>
                    {!sessionReady && (
                        <p className="text-xs text-center text-muted-foreground">
                            Waiting for your reset link to be verified…
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                    disabled={!sessionReady}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={!sessionReady}
                            />
                        </div>
                        <Button type="submit" className="w-full mt-2" disabled={loading || !sessionReady}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                        <button
                            type="button"
                            onClick={() => navigate('/signin')}
                            className="text-sm text-center text-muted-foreground hover:text-foreground"
                        >
                            Back to sign in
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
