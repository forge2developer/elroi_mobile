import LoginScreen from '@/app/main/src/modules/auth/LoginScreen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Toast, ToastTitle, useToast, VStack } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';

import { BASE_URL } from '@/src/config/apiConfig';

const API_BASE_URL = BASE_URL;

export default function LoginRoute() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const router = useRouter();
    const toast = useToast();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const { login } = useAuth();

    const handleLogin = async (email: string, password: string) => {
        try {
            setError('');
            setIsLoading(true);

            console.log(`[Login] Attempting login to: ${API_BASE_URL}/api/auth/login`);
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Invalid credentials');
            }

            // Extract session data
            const resData = data.data || data;
            const token = resData.token;
            const userRole = resData.role || 'user';
            const organization = resData.organization || 'Elite'; // Default if missing
            const userId = resData.user_id || resData._id || 'unknown';
            
            // Extract profile data
            const firstName = resData.firstName || '';
            const lastName = resData.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'User';
            const emailAddr = resData.email || email;
            
            let profileImageUrl = resData.profileImagePath || null;
            // Prepend base URL if it's a relative path
            if (profileImageUrl && !profileImageUrl.startsWith('http')) {
                profileImageUrl = `${API_BASE_URL}${profileImageUrl}`;
            }

            // Use AuthContext to persist session correctly
            await login({
                token,
                role: userRole,
                organization,
                userId,
                name: fullName,
                email: emailAddr,
                profileImage: profileImageUrl
            });

            console.log('Login success and persisted:', organization, userRole);

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

            // Navigate based on role — admin/manager go to Master Dashboard
            if (userRole === 'admin' || userRole === 'manager') {
                router.replace('/(drawer)/Master_dashboard');
            } else {
                router.replace('/(drawer)/dashboard');
            }
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
