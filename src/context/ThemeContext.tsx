import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'system',
    setMode: () => { },
    resolvedMode: 'dark',
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('themeMode');
        return (saved as ThemeMode) || 'system';
    });

    const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const resolvedMode = mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

    return (
        <ThemeContext.Provider value={{ mode, setMode, resolvedMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
