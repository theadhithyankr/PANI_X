import { useEffect } from 'react';

/**
 * Custom hook to dynamically update the favicon based on theme
 * @param theme - Current theme ('light' or 'dark')
 */
export function useFavicon(theme: 'light' | 'dark') {
    useEffect(() => {
        const faviconPath = theme === 'dark' ? '/pani-favicon-dark.png' : '/pani-favicon-light.png';

        // Find existing favicon link or create new one
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }

        // Update the favicon
        link.type = 'image/png';
        link.href = faviconPath;
    }, [theme]);
}
