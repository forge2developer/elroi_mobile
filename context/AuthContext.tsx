import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthData, clearAuth, getAuth, saveAuth } from '../src/storage/authStorage';

interface AuthState {
    token: string | null;
    organization: string | null;
    role: string | null;
    userId: string | null;
    name?: string | null;
    email?: string | null;
    profileImage?: string | null;
}

interface AuthContextType extends AuthState {
    login: (data: AuthData) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<AuthData>) => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        organization: null,
        role: null,
        userId: null,
        name: null,
        email: null,
        profileImage: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const storedAuth = await getAuth();
                if (storedAuth) {
                    setAuthState({
                        token: storedAuth.token,
                        organization: storedAuth.organization,
                        role: storedAuth.role,
                        userId: storedAuth.userId,
                        name: storedAuth.name || null,
                        email: storedAuth.email || null,
                        profileImage: storedAuth.profileImage || null,
                    });
                }
            } catch (error) {
                console.error('Failed to load persistent auth state', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    const login = async (data: AuthData) => {
        try {
            await saveAuth(data);
            setAuthState(data);
        } catch (error) {
            console.error('Login save failed', error);
            throw error;
        }
    };

    const updateProfile = async (data: Partial<AuthData>) => {
        try {
            const currentAuth = await getAuth();
            if (currentAuth) {
                const updatedAuth = { ...currentAuth, ...data } as AuthData;
                await saveAuth(updatedAuth);
                setAuthState(updatedAuth);
            }
        } catch (error) {
            console.error('Update profile save failed', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await clearAuth();
            setAuthState({
                token: null,
                organization: null,
                role: null,
                userId: null,
                name: null,
                email: null,
                profileImage: null,
            });
        } catch (error) {
            console.error('Logout clear failed', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, updateProfile, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * AuthContext.tsx
 * 
 * Provides a React Context for authentication state throughout the app.
 * It manages token, organization, role, and userId.
 * Exports `useAuth` hook for easy consumption by functional components.
 * Restores session automatically on mount using authStorage.
 */
