import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@auth_session';

export interface AuthData {
    token: string;
    organization: string;
    role: string;
    userId: string;
}

/**
 * Saves the authentication session data securely to AsyncStorage.
 * @param data AuthData object containing token, organization, role, and userId.
 */
export const saveAuth = async (data: AuthData): Promise<void> => {
    try {
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving auth data to storage', error);
        throw error;
    }
};

/**
 * Retrieves the authentication session data from AsyncStorage.
 * @returns Parsed AuthData object or null if no session exists or parsing fails.
 */
export const getAuth = async (): Promise<AuthData | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(AUTH_KEY);
        return jsonValue ? (JSON.parse(jsonValue) as AuthData) : null;
    } catch (error) {
        console.error('Error getting auth data from storage', error);
        return null;
    }
};

/**
 * Clears the authentication session data from AsyncStorage.
 */
export const clearAuth = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(AUTH_KEY);
    } catch (error) {
        console.error('Error clearing auth data from storage', error);
        throw error;
    }
};

/**
 * authStorage.ts
 * 
 * Manages the persistence of authentication-related data.
 * Extracted into a dedicated file for separation of concerns and strongly typed for safety.
 */
