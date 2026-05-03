import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

export default function SignUpCard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [nameError, setNameError] = React.useState(false);
    const [nameErrorMessage, setNameErrorMessage] = React.useState('');
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [role, setRole] = React.useState('candidate');
    const [showPassword, setShowPassword] = React.useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (validateInputs()) {
            const email = (document.getElementById('email') as HTMLInputElement).value;
            const password = (document.getElementById('password') as HTMLInputElement).value;
            const name = (document.getElementById('name') as HTMLInputElement).value;

            setLoading(true);
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: role,
                    },
                },
            });
            setLoading(false);

            if (error) {
                toast(error.message, 'error');
            } else {
                toast('Check your email for the confirmation link!', 'success');
                navigate('/signin');
            }
        }
    };

    const validateInputs = () => {
        const name = document.getElementById('name') as HTMLInputElement;
        const email = document.getElementById('email') as HTMLInputElement;
        const password = document.getElementById('password') as HTMLInputElement;

        let isValid = true;

        if (!name.value || name.value.length < 1) {
            setNameError(true);
            setNameErrorMessage('Name is required.');
            isValid = false;
        } else {
            setNameError(false);
            setNameErrorMessage('');
        }

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
        <Card className="w-full sm:w-[500px] shadow-2xl bg-card/95 backdrop-blur border-border/50">
            <CardHeader className="space-y-4 pb-6">
                <CardTitle className="text-3xl text-center font-bold">Sign up</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    
                    <Tabs defaultValue="candidate" onValueChange={setRole} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-2">
                            <TabsTrigger value="candidate">Candidate</TabsTrigger>
                            <TabsTrigger value="employer">Employer</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-2">
                        <Label htmlFor="name" className={nameError ? "text-destructive" : ""}>Full name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Naruto Uzumaki"
                            autoComplete="name"
                            required
                            className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {nameError && <p className="text-xs text-destructive">{nameErrorMessage}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className={emailError ? "text-destructive" : ""}>Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            autoComplete="email"
                            required
                            className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {emailError && <p className="text-xs text-destructive">{emailErrorMessage}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className={passwordError ? "text-destructive" : ""}>Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••"
                                autoComplete="new-password"
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

                    <div className="flex items-center space-x-2 pb-1">
                        <Checkbox id="allowExtraEmails" />
                        <Label htmlFor="allowExtraEmails" className="font-normal text-muted-foreground leading-tight">
                            I want to receive updates via email.
                        </Label>
                    </div>

                    <Button type="submit" className="w-full font-bold" disabled={loading}>
                        {loading ? 'Signing up...' : 'Sign up'}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground mt-1">
                        Already have an account?{' '}
                        <Link to="/signin" className="text-primary hover:underline font-medium">
                            Sign in
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

                    <Button variant="outline" type="button" className="w-full" onClick={() => toast('Google sign-up coming soon!', 'info')}>
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
                        Sign up with Google
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
