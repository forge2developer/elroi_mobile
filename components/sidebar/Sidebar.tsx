import { useThemeContext } from '@/context/theme-context';
import { useAuth } from '@/context/AuthContext';
import { BASE_URL } from '@/src/config/apiConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    Briefcase,
    Calendar,
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    LucideIcon,
    Moon,
    Sun,
    User,
    Users,
    LogOut,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
    FadeInLeft,
    FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────
type SubItem = {
    label: string;
    route: string;
};

type MenuItem = {
    icon: LucideIcon;
    label: string;
    route?: string;
    subItems?: SubItem[];
};

type Section = {
    title: string;
    items: MenuItem[];
};

// ─── Theme Helper (Polished) ─────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#000000' : '#FFFFFF',
        surface: isDark ? '#0A0A0A' : '#F8FAFC',
        text: isDark ? '#FFFFFF' : '#0F172A',
        textSecondary: isDark ? '#A1A1AA' : '#64748B',
        iconColor: isDark ? '#A1A1AA' : '#64748B',
        border: isDark ? '#18181B' : '#E2E8F0',
        sectionTitle: isDark ? '#52525B' : '#94A3B8',
        activeBg: isDark ? '#FFFFFF10' : '#EFF6FF',
        activeText: isDark ? '#FFFFFF' : '#2563EB',
        subActiveBg: isDark ? '#FFFFFF08' : '#F1F5F9',
        indicator: isDark ? 'white' : 'black',
        avatarBg: isDark ? '#111111' : '#F1F5F9',
        logoBg: isDark ? '#111111' : '#EFF6FF',
        logoutBg: isDark ? '#EF444415' : '#FEF2F2',
        logoutText: '#EF4444',
    };
}

// ─── Menu Data Hook ──────────────────────────────────────────
function useMenuData(role: string | null) {
    return useMemo((): Section[] => [
        {
            title: 'Workspace',
            items: [
                {
                    icon: LayoutDashboard,
                    label: (role === 'admin' || role === 'manager') ? 'Master View' : 'Dashboard',
                    route: (role === 'admin' || role === 'manager') ? '/(drawer)/Master_dashboard' : '/(drawer)/dashboard'
                },
                {
                    icon: Users,
                    label: 'Total Leads',
                    route: '/(drawer)/leads',
                },
                {
                    icon: Calendar,
                    label: 'Calendar',
                    route: '/(drawer)/calendar',
                }
            ],
        },
    ], [role]);
}

// ─── Components ──────────────────────────────────────────────

function CollapsibleMenuItem({ item, theme, pathname }: { item: MenuItem; theme: any; pathname: string }) {
    const [expanded, setExpanded] = useState(false);
    const rotation = useSharedValue(0);
    const router = useRouter();
    const isActive = item.subItems?.some((sub) => pathname === sub.route);

    const toggle = () => {
        const toValue = expanded ? 0 : 1;
        rotation.value = withTiming(toValue, { duration: 250 });
        setExpanded(!expanded);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }]
    }));

    const IconComponent = item.icon;

    return (
        <View className="mb-1">
            <Pressable
                onPress={toggle}
                className="flex-row items-center py-3 px-3 rounded-2xl gap-3"
                style={[isActive && { backgroundColor: theme.activeBg }]}
            >
                <View className="w-9 h-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isActive ? theme.activeBg : theme.surface }}>
                    <IconComponent size={20} color={isActive ? theme.activeText : theme.iconColor} strokeWidth={isActive ? 2.2 : 2} />
                </View>
                <Text className="flex-1 text-[15px]" style={[{ color: isActive ? theme.activeText : theme.text, fontWeight: isActive ? '700' : '600' }]}>
                    {item.label}
                </Text>
                <Animated.View style={animatedIconStyle}>
                    <ChevronRight size={16} color={theme.textSecondary} />
                </Animated.View>
            </Pressable>

            {expanded && (
                <View className="ml-7 pl-4 mt-1 mb-2 border-l" style={[{ borderLeftColor: theme.border }]}>
                    {item.subItems?.map((sub, idx) => {
                        const isSubActive = pathname === sub.route;
                        return (
                            <Animated.View key={sub.label} entering={FadeInLeft.delay(idx * 50).duration(200)}>
                                <Pressable
                                    onPress={() => {
                                        router.replace(sub.route as any);
                                        Haptics.selectionAsync();
                                    }}
                                    className="py-2.5 px-4 rounded-xl mb-1"
                                    style={[isSubActive && { backgroundColor: theme.subActiveBg }]}
                                >
                                    <Text
                                        className="text-[14px]"
                                        style={[{ color: isSubActive ? theme.activeText : theme.textSecondary, fontWeight: isSubActive ? '600' : '500' }]}
                                    >
                                        {sub.label}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

function FlatMenuItem({ item, theme, pathname }: { item: MenuItem; theme: any; pathname: string }) {
    const router = useRouter();
    const isActive = pathname === item.route;
    const IconComponent = item.icon;

    return (
        <Pressable
            onPress={() => {
                if (item.route) {
                    router.replace(item.route as any);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            }}
            className="flex-row items-center py-3 px-3 rounded-2xl gap-3 mb-1 overflow-hidden"
            style={[isActive && { backgroundColor: theme.activeBg }]}
        >
            {isActive && (
                <View
                    style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 4, backgroundColor: theme.indicator, borderRadius: 10 }}
                />
            )}
            <View className="w-9 h-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: isActive ? theme.activeBg : theme.surface }}>
                <IconComponent size={20} color={isActive ? theme.activeText : theme.iconColor} strokeWidth={isActive ? 2.2 : 2} />
            </View>
            <Text className="flex-1 text-[15px]" style={[
                { color: isActive ? theme.activeText : theme.text, fontWeight: isActive ? '700' : '600' }
            ]}>
                {item.label}
            </Text>
        </Pressable>
    );
}

// ─── Main Sidebar ─────────────────────────────────────────────
export default function Sidebar() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const pathname = usePathname();
    const router = useRouter();
    const { setThemePreference } = useThemeContext();
    const { role, organization, logout, name, email, profileImage } = useAuth();

    // Helper to fix image URLs for development (relative paths or localhost)
    const formatProfileImage = (path: string | null | undefined) => {
        if (!path) return null;
        if (!path.startsWith('http')) {
            return `${BASE_URL}${path}`;
        }
        // Dev fix: Replace localhost with actual server IP if needed
        if (path.includes('localhost') || path.includes('127.0.0.1')) {
            return path.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/, BASE_URL);
        }
        return path;
    };

    const toggleTheme = () => {
        setThemePreference(isDark ? 'light' : 'dark');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const sections = useMenuData(role);

    const formattedProfileImage = formatProfileImage(profileImage);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} className="px-5 pt-4 pb-6">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                        <View className="w-12 h-12 rounded-2xl items-center justify-center overflow-hidden">
                            <Image 
                                source={isDark ? require('@/assets/logo/dark.png') : require('@/assets/logo/light.png')}
                                style={{ width: 36, height: 36 }}
                                resizeMode="contain"
                            />
                        </View>
                        <View>
                            <Text className="text-[19px] font-black tracking-tight" style={{ color: theme.text }}>Growvix</Text>
                            <Text className="text-[13px] font-semibold opacity-60 uppercase tracking-widest" style={{ color: theme.textSecondary }}>CRM</Text>
                        </View>
                    </View>
                    <Pressable
                        onPress={toggleTheme}
                        className="w-10 h-10 rounded-full items-center justify-center hover:opacity-80"
                        style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                    >
                        {isDark ? (
                            <Sun size={18} color={theme.indicator} />
                        ) : (
                            <Moon size={18} color={theme.indicator} />
                        )}
                    </Pressable>
                </View>
            </Animated.View>

            {/* Scrolling Menu */}
            <ScrollView
                className="flex-1 px-3"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
            >
                {sections.map((section, sIdx) => (
                    <View key={section.title} className="mt-2">
                        <Text className="text-[11px] font-bold uppercase tracking-[1.5px] px-4 mb-3" style={{ color: theme.sectionTitle }}>
                            {section.title}
                        </Text>
                        {section.items.map((item, iIdx) => (
                            <Animated.View key={item.label} entering={FadeInLeft.delay(100 + (sIdx * 100) + (iIdx * 50)).duration(300)}>
                                {item.subItems ? (
                                    <CollapsibleMenuItem item={item} theme={theme} pathname={pathname} />
                                ) : (
                                    <FlatMenuItem item={item} theme={theme} pathname={pathname} />
                                )}
                            </Animated.View>
                        ))}
                    </View>
                ))}
            </ScrollView>

            {/* Profile Footer */}
            <View className="px-4 py-5 border-t" style={{ borderTopColor: theme.border }}>
                <Pressable
                    onPress={() => {
                        router.push('/(drawer)/profile' as any);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                    className="flex-row items-center p-3 rounded-2xl"
                    style={{ backgroundColor: theme.surface }}
                >
                    <View className="w-11 h-11 rounded-xl items-center justify-center relative shadow-sm" style={{ backgroundColor: theme.avatarBg }}>
                        {formattedProfileImage ? (
                            <Animated.Image 
                                source={{ uri: formattedProfileImage }} 
                                className="w-11 h-11 rounded-xl"
                            />
                        ) : (
                            <User size={24} color={theme.textSecondary} />
                        )}
                        <View className="absolute bottom-[-1] right-[-1] w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500" style={{ borderColor: theme.surface }} />
                    </View>
                    <View className="flex-1 ml-3">
                        <Text className="text-[14px] font-bold" style={{ color: theme.text }} numberOfLines={1}>
                            {name || 'User'}
                        </Text>
                        <Text className="text-[11px] font-medium opacity-60" style={{ color: theme.textSecondary }} numberOfLines={1}>
                            {email || ''}
                        </Text>
                    </View>
                    <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: theme.bg }}>
                        <ChevronRight size={16} color={theme.textSecondary} />
                    </View>
                </Pressable>

                <Pressable
                    onPress={async () => {
                        await logout();
                        router.replace('/auth/login');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }}
                    className="mt-3 flex-row items-center justify-center py-3 rounded-2xl"
                    style={{ backgroundColor: theme.logoutBg }}
                >
                    <LogOut size={16} color={theme.logoutText} strokeWidth={2.5} />
                    <Text className="ml-2 font-bold text-[13px]" style={{ color: theme.logoutText }}>Sign Out</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}



