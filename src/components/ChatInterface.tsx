import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useMessages, useProfile } from '../hooks/useSupabase';
import { useToast } from '../contexts/ToastContext';

interface Props {
    otherUserId: string;
    otherUserName: string;
}

export default function ChatInterface({ otherUserId, otherUserName }: Props) {
    const { messages, loading, fetchMessages, sendMessage } = useMessages();
    const { profile } = useProfile();
    const toast = useToast();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (otherUserId) {
            let cleanup: (() => void) | undefined;
            fetchMessages(otherUserId).then(fn => { cleanup = fn; });
            return () => { cleanup?.(); };
        }
    }, [otherUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        try {
            await sendMessage(otherUserId, newMessage);
            setNewMessage('');
        } catch (error: any) {
            toast(`Message failed: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <div className="flex flex-col h-[500px] bg-card">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
                <p className="font-semibold text-foreground text-sm">Chat with {otherUserName}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center mt-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-center mt-8 text-sm text-muted-foreground">No messages yet. Say hi!</p>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === profile?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                                    isMe
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : 'bg-muted/50 text-foreground rounded-bl-sm'
                                }`}>
                                    <p>{msg.content}</p>
                                    <p className="text-[10px] opacity-70 mt-0.5 text-right">{msg.created_at}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/60">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-background border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                />
                <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
