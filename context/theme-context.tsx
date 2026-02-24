import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextType = {
    /** The resolved color scheme: always 'light' or 'dark' */
    colorScheme: 'light' | 'dark';
    /** The user's raw preference */
    themePreference: ThemePreference;
    /** Change the theme preference */
    setThemePreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    colorScheme: 'light',
    themePreference: 'system',
    setThemePreference: () => { },
});

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useSystemColorScheme();
    const [themePreference, setThemePreference] = useState<ThemePreference>('system');

    const colorScheme = useMemo<'light' | 'dark'>(() => {
        if (themePreference === 'system') {
            return systemScheme ?? 'light';
        }
        return themePreference;
    }, [themePreference, systemScheme]);

    const value = useMemo(
        () => ({ colorScheme, themePreference, setThemePreference }),
        [colorScheme, themePreference]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    return useContext(ThemeContext);
}
