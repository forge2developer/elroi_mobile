import Sidebar from '@/components/sidebar/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Drawer } from 'expo-router/drawer';
import { Redirect } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function DrawerLayout() {
    const { role, token, isLoading } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Auth Guard: Redirect if not logged in
    if (!token && !isLoading) {
        return <Redirect href="/auth/login" />;
    }

    const isAuthorized = role === 'admin' || role === 'Admin' || role === 'manager' || role === 'Manager';

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                initialRouteName={isAuthorized ? "Master_dashboard" : "dashboard"}
                backBehavior="none"
                drawerContent={() => <Sidebar />}
                screenOptions={{
                    headerShown: false,
                    drawerType: 'front',
                    drawerStyle: {
                        width: 280,
                        backgroundColor: isDark ? '#000000' : '#ffffff',
                        borderRightWidth: 1,
                        borderRightColor: isDark ? '#1a1a1a' : '#e2e8f0',
                    },
                    swipeEnabled: true,
                }}
            >
                <Drawer.Screen name="Master_dashboard" options={{ title: 'Master Dashboard' }} />
                <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
                <Drawer.Screen name="leads" options={{ title: 'Leads' }} />

                <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
            </Drawer>
        </GestureHandlerRootView>
    );
}
