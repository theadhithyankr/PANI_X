import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PageContextData {
    page: string;
    summary: string;
    suggestions?: string[];
}

interface PageContextValue {
    pageContext: PageContextData | null;
    setPageContext: (data: PageContextData) => void;
    clearPageContext: () => void;
}

const PageContext = createContext<PageContextValue>({
    pageContext: null,
    setPageContext: () => {},
    clearPageContext: () => {},
});

export function PageContextProvider({ children }: { children: ReactNode }) {
    const [pageContext, setPageContextState] = useState<PageContextData | null>(null);

    const setPageContext = useCallback((data: PageContextData) => {
        setPageContextState(data);
    }, []);

    const clearPageContext = useCallback(() => {
        setPageContextState(null);
    }, []);

    return (
        <PageContext.Provider value={{ pageContext, setPageContext, clearPageContext }}>
            {children}
        </PageContext.Provider>
    );
}

export const usePageContext = () => useContext(PageContext);
