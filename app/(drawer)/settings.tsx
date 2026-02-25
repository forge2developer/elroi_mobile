import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { CalendarClock, FileText, Import, Menu, UserRoundCog, Users } from 'lucide-react-native';
import React from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Theme ──────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#000000' : '#f8f9fa',
        headerBg: isDark ? '#111111' : '#ffffff',
        cardBg: isDark ? '#2a2a2aff' : '#ffffff',
        // Increased contrast for borders so they are clearly visible
        border: isDark ? '#9ca3af' : '#cbd5e1',
        borderLight: isDark ? '#374151' : '#e2e8f0', // Thinner, lighter border color
        text: isDark ? '#ffffff' : '#1e293b',
        textSecondary: isDark ? '#94a3b8' : '#64748b',
        iconBgMap: {
            blue: isDark ? '#172554' : '#eff6ff',
            purple: isDark ? '#2e1065' : '#f5f3ff',
            red: isDark ? '#4c0519' : '#fff1f2',
            yellow: isDark ? '#422006' : '#fffbeb',
            green: isDark ? '#052e16' : '#f0fdf4',
        },
        iconColorMap: {
            blue: isDark ? '#60a5fa' : '#3b82f6',
            purple: isDark ? '#c084fc' : '#a855f7',
            red: isDark ? '#fb7185' : '#f43f5e',
            yellow: isDark ? '#facc15' : '#eab308',
            green: isDark ? '#4ade80' : '#22c55e',
        }
    };
}

// ─── Data ───────────────────────────────────────────────────────────────────
const SETTING_CARDS = [
    {
        id: 'users',
        title: 'Manage Users',
        icon: UserRoundCog,
        color: 'blue' as const,
    },
    {
        id: 'teams',
        title: 'Manage Teams',
        icon: Users,
        color: 'purple' as const,
    },
    {
        id: 'billing',
        title: 'Billing',
        icon: FileText,
        color: 'red' as const,
    },
    {
        id: 'attendance',
        title: 'Attendance',
        icon: CalendarClock,
        color: 'yellow' as const,
    },
    {
        id: 'import',
        title: 'Import Data',
        icon: Import,
        color: 'green' as const,
    },
];

// ─── Components ─────────────────────────────────────────────────────────────
function SettingCard({
    item,
    theme,
    cardWidth,
}: {
    item: typeof SETTING_CARDS[0];
    theme: ReturnType<typeof getTheme>;
    cardWidth: any;
}) {
    const IconComponent = item.icon;
    const iconColor = theme.iconColorMap[item.color];
    const iconBg = theme.iconBgMap[item.color];
    const router = useRouter();

    const handlePress = () => {
        if (item.id === 'users') {
            router.push('/(drawer)/user-management' as any);
        }
    };

    return (
        <View style={{ width: cardWidth, marginBottom: 6 }}>
            <Pressable
                onPress={handlePress}
                className="py-5 px-5 rounded-2xl flex-row items-center gap-4 active:opacity-70"
                style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                }}
            >
                <View
                    className="w-12 h-12 rounded-full justify-center items-center"
                    style={{ backgroundColor: iconBg }}
                >
                    <IconComponent size={24} color={iconColor} strokeWidth={2.5} />
                </View>
                <Text className="text-[17px] pl-1" style={{ color: theme.text, fontWeight: '500' }}>
                    {item.title}
                </Text>
            </Pressable>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const navigation = useNavigation();
    const { bottom } = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Responsive: If width is small (phones), use 100% width for cards.
    // If width is large (tablets/web), use ~48% to fit 2 per row.
    const isSmallScreen = width < 600;
    const cardWidth = isSmallScreen ? '100%' : '100%';

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.headerBg }}>
            {/* Top Navigation Bar */}
            <View
                className="flex-row items-center px-4 py-[14px] border-b-0"
                style={{ backgroundColor: theme.headerBg, borderBottomColor: theme.border }}
            >
                <Pressable
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    className="p-1.5 pl-6"
                >
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5">
                    <Text className="text-base font-extrabold text-xl" style={{ color: theme.text }}>
                        Settings Workspace
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                className="flex-1"
                style={{ backgroundColor: theme.bg }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 30, paddingBottom: bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Grid Area */}
                <View
                    className="w-full max-w-[600px] self-center"
                >
                    {SETTING_CARDS.map((card) => (
                        <SettingCard
                            key={card.id}
                            item={card}
                            theme={theme}
                            cardWidth={cardWidth}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
