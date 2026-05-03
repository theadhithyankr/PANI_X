
import SignUpCard from '../components/SignUpCard';

export default function SignUp() {
    return (
        <main className="relative flex flex-col justify-center items-center min-h-screen p-4 bg-background z-0">
            {/* Background Gradient */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(167,139,250,0.18)_0%,transparent_72%)] pointer-events-none" />
            
            <div className="flex justify-center p-4 mx-auto w-full max-w-md">
                <SignUpCard />
            </div>
        </main>
    );
}
