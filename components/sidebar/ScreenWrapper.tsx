import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { Menu, ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
    Pressable,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenWrapper({
    title,
    children,
    headerRight,
    showBackButton,
    onBack,
}: {
    title: string;
    children?: React.ReactNode;
    headerRight?: React.ReactNode;
    showBackButton?: boolean;
    onBack?: () => void;
}) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const navigation = useNavigation();
    const router = useRouter();

    const canGoBack = showBackButton !== undefined ? showBackButton : navigation.canGoBack();

    const theme = {
        bg: isDark ? '#000' : '#fff',
        headerBg: isDark ? '#0a0a0a' : '#fff',
        border: isDark ? '#1f1f1f' : '#eee',
        text: isDark ? '#f0f0f0' : '#111',
        textSecondary: isDark ? '#888' : '#666',
        searchBg: isDark ? '#1a1a1a' : '#f0f0f0',
        searchBorder: isDark ? '#333' : '#ddd',
        searchText: isDark ? '#e0e0e0' : '#333',
        accent: isDark ? '#818cf8' : '#1a73e8',
        onlineBg: isDark ? '#064e3b' : '#d1fae5',
        onlineText: isDark ? '#34d399' : '#059669',
        onlineDot: '#22c55e',
        iconColor: isDark ? '#aaa' : '#555',
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right', 'bottom']}>
            {/* ─ Top Bar ─ */}
            <View className="flex-row items-center px-3 py-2 border-b gap-2" style={[{ backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                {/* Left: Back Arrow or Hamburger */}
                {canGoBack ? (
                    <Pressable
                        onPress={handleBack}
                        className="p-1.5 pl-4"
                    >
                        <ArrowLeft size={24} color={theme.text} />
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        className="p-1.5 pl-4"
                    >
                        <Menu size={24} color={theme.text} />
                    </Pressable>
                )}
                
                <Pressable 
                    onPress={() => {
                        if (canGoBack) {
                            handleBack();
                        } else {
                            navigation.dispatch(DrawerActions.openDrawer());
                        }
                    }} 
                    className="p-1.5 flex-1"
                >
                    <Text className="text-[17px] font-bold" numberOfLines={1} style={[{ color: theme.text }]}>
                        {title}
                    </Text>
                </Pressable>

                {/* Right Action Area */}
                <View className="flex-row items-center pr-2">
                    {headerRight}
                </View>
            </View>

            {/* ─ Content ─ */}
            {children ? (
                <View className="flex-1" style={[{ backgroundColor: theme.bg }]}>
                    {children}
                </View>
            ) : (
                <View className="flex-1 items-center justify-center p-6" style={[{ backgroundColor: theme.bg }]}>
                    <Text className="text-[16px]" style={{ color: theme.textSecondary }}>
                        {title} screen content
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}


