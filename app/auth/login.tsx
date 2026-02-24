import LoginScreen from '@/app/main/src/modules/auth/LoginScreen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Toast, ToastTitle, useToast, VStack } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API base URL logic
const getApiBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    // Android emulator localhost
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
    // iOS/Web localhost
    return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export default function LoginRoute() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const router = useRouter();
    const toast = useToast();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleLogin = async (email: string, password: string) => {
        try {
            setError('');
            setIsLoading(true);

            console.log(`[Login] Attempting login to: ${API_BASE_URL}/api/auth/login`);
            console.log('[Login] Payload:', { email, password: '***' });

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('[Login] Response status:', response.status);

            const data = await response.json();

            if (!response.ok) {
                console.error('[Login] Error response:', data);
                throw new Error(data.message || data.error || 'Invalid credentials');
            }

            // Store token & user profile
            const { token, ...userProfile } = data.data || data;

            try {
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(userProfile));
            } catch (e) {
                console.warn('AsyncStorage not installed, session not saved');
            }

            console.log('Login success:', userProfile);

            toast.show({
                placement: "top",
                render: ({ id }) => {
                    const toastId = "toast-" + id;
                    return (
                        <Toast nativeID={toastId} action="success" variant="solid"
                            bg={isDark ? '#111' : '#fff'}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#ddd'}
                            borderRadius="$xl"
                            mt="$10">
                            <VStack space="xs">
                                <ToastTitle color={isDark ? '#fff' : '#111'}>Login successful.</ToastTitle>
                            </VStack>
                        </Toast>
                    );
                },
            });

            // Navigate to main app
            router.replace('/(drawer)/dashboard');
        } catch (err: any) {
            console.error('[Login] Exception:', err);
            if (err.message === 'Network request failed') {
                setError(`Cannot connect to server at ${API_BASE_URL}. Check your network.`);
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LoginScreen
            onLogin={handleLogin}
            isLoading={isLoading}
            error={error}
        />
    );
}
