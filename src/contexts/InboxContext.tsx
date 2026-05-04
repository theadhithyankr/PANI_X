import { createContext, useContext, ReactNode } from 'react';
import { useInbox } from '../hooks/useSupabase';

type InboxContextValue = ReturnType<typeof useInbox>;

const InboxContext = createContext<InboxContextValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
    const inbox = useInbox();
    return <InboxContext.Provider value={inbox}>{children}</InboxContext.Provider>;
}

export function useInboxContext(): InboxContextValue {
    const ctx = useContext(InboxContext);
    if (!ctx) throw new Error('useInboxContext must be used within InboxProvider');
    return ctx;
}
