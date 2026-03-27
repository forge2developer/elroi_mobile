import Sidebar from '@/components/sidebar/Sidebar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function DrawerLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={() => <Sidebar />}
                screenOptions={{
                    headerShown: false,
                    drawerType: 'front',
                    drawerStyle: {
                        width: 280,
                        backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
                        borderRightWidth: 1,
                        borderRightColor: isDark ? '#333333' : '#e2e8f0',
                    },
                    swipeEnabled: true,
                }}
            >
                <Drawer.Screen name="Master_dashboard" options={{ title: 'Master Dashboard' }} />
                <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
                <Drawer.Screen name="leads" options={{ title: 'Leads' }} />
                <Drawer.Screen name="leads/lead_detail" options={{ title: 'Lead Details', drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="leads/add" options={{ title: 'Add Lead', drawerItemStyle: { display: 'none' } }} />
                
                <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
            </Drawer>
        </GestureHandlerRootView>
    );
}
