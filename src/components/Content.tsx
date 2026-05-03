import { BrainCircuit, EyeOff, MessageSquareHeart, Wand2 } from 'lucide-react';

const items = [
    {
        icon: <BrainCircuit className="text-muted-foreground w-6 h-6 shrink-0 mt-1" />,
        title: 'AI-Powered Matching',
        description:
            'Our intelligent algorithms analyze resumes and job descriptions to find the perfect fit based on skills, not just keywords.',
    },
    {
        icon: <EyeOff className="text-muted-foreground w-6 h-6 shrink-0 mt-1" />,
        title: 'Blind Hiring Mode',
        description:
            'eliminate unconscious bias by hiding candidate names and photos during the initial screening process.',
    },
    {
        icon: <MessageSquareHeart className="text-muted-foreground w-6 h-6 shrink-0 mt-1" />,
        title: 'Auto-Feedback',
        description:
            'Respect every applicant. Our AI generates constructive, personalized feedback for every rejected candidate instantly.',
    },
    {
        icon: <Wand2 className="text-muted-foreground w-6 h-6 shrink-0 mt-1" />,
        title: 'Resume Parsing',
        description:
            'Upload a PDF and let our system extract your profile details automatically, saving you time.',
    },
];

export default function Content() {
    return (
        <div className="flex flex-col self-center gap-8 max-w-[450px]">
            <div className="hidden md:flex">
                <img
                    src="/logo.png"
                    alt="Pani Logo"
                    className="w-[150px] h-[60px] object-contain"
                />
            </div>
            {items.map((item, index) => (
                <div key={index} className="flex flex-row gap-4">
                    {item.icon}
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-foreground text-lg mb-1">
                            {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
