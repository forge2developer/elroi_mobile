import { useThemeContext } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname, useRouter } from 'expo-router';
import {
    Briefcase,
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    LayoutDashboard,
    LucideIcon,
    Moon,
    MoreHorizontal,
    Package,
    PieChart,
    Plane,
    Sun,
    User,
    Users
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
    Animated,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// ─── Menu Data ───────────────────────────────────────────────
const MENU_SECTIONS: Section[] = [
    {
        title: 'Workspace',
        items: [
            {
                icon: LayoutDashboard,
                label: 'Dashboard',
                subItems: [
                    { label: 'Master View', route: '/(drawer)/dashboard' },
                ],
            },
            {
                icon: Users,
                label: 'Lead Directory',
                subItems: [
                    { label: 'Total Leads', route: '/(drawer)/leads' },
                   // { label: 'Add New Lead', route: '/(drawer)/add-lead' },
                ],
            },
            {
                icon: Package,
                label: 'Inventory',
                subItems: [
                    { label: 'Projects', route: '/(drawer)/inventory' },
                    //  { label: 'Add Project', route: '/(drawer)/inventory/new' },
                ],
            },
            {
                icon: PieChart,
                label: 'Reports',
                subItems: [
                    { label: 'General Reports', route: '/(drawer)/reports/general' },
                    { label: 'Lead Stage Analysis', route: '/(drawer)/reports/lead-stage' },
                ],
            },
        ],
    },
    {
        title: 'General',
        items: [
            // {
            //     icon: Settings,
            //     label: 'Settings',
            //     route: '/(drawer)/settings'
            // },
            { icon: Calendar, label: 'Calendar', route: '/(drawer)/calendar' },
            { icon: Clock, label: 'Sales & Marketing', route: '/(drawer)/sales' },
            { icon: Plane, label: 'Travel', route: '/(drawer)/travel' },
            { icon: MoreHorizontal, label: 'More', route: '/(drawer)/more' },
        ],
    },
];

// ─── Collapsible Menu Item ───────────────────────────────────
function CollapsibleMenuItem({
    item,
    theme,
    pathname,
}: {
    item: MenuItem;
    theme: ReturnType<typeof getTheme>;
    pathname: string;
}) {
    const [expanded, setExpanded] = React.useState(true);
    const rotateAnim = React.useRef(new Animated.Value(1)).current;
    const heightAnim = React.useRef(new Animated.Value(1)).current;
    const router = useRouter();

    const toggle = () => {
        const toValue = expanded ? 0 : 1;
        Animated.parallel([
            Animated.timing(rotateAnim, {
                toValue,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(heightAnim, {
                toValue,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
        setExpanded(!expanded);
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const subItemCount = item.subItems?.length || 0;
    // Calculate approximate height: each subitem ~40px plus container margins/paddings
    const expandedHeight = (subItemCount * 45) + 16;
    const maxHeight = heightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, expandedHeight],
    });

    const isActive = item.subItems?.some((sub) => pathname === sub.route);
    const IconComponent = item.icon;

    return (
        <View>
            <Pressable
                onPress={toggle}
                className="flex-row items-center py-2.5 px-2.5 rounded-lg gap-2.5"
                style={[isActive && { backgroundColor: theme.activeBg }]}
            >
                <IconComponent size={20} color={isActive ? theme.activeText : theme.iconColor} />
                <Text className="flex-1 text-[14px] font-medium" style={[{ color: isActive ? theme.activeText : theme.text }]}>
                    {item.label}
                </Text>
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <ChevronDown size={20} color={theme.textSecondary} />
                </Animated.View>
            </Pressable>

            <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
                <View className="ml-[30px] pl-3 mt-1 mb-2 border-l" style={[{ borderLeftColor: theme.border }]}>
                    {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.route;
                        return (
                            <Pressable
                                key={sub.label}
                                onPress={() => router.push(sub.route as any)}
                                className="py-2.5 px-4 rounded-lg mb-0.5"
                                style={[isSubActive && { backgroundColor: theme.subActiveBg }]}
                            >
                                <Text
                                    className="text-[14px]"
                                    style={[{ color: isSubActive ? theme.activeText : theme.textSecondary, fontWeight: isSubActive ? '600' : '400' }]}
                                >
                                    {sub.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Animated.View>
        </View>
    );
}

// ─── Flat Menu Item ──────────────────────────────────────────
function FlatMenuItem({
    item,
    theme,
    pathname,
}: {
    item: MenuItem;
    theme: ReturnType<typeof getTheme>;
    pathname: string;
}) {
    const router = useRouter();
    const isActive = pathname === item.route;
    const IconComponent = item.icon;

    return (
        <Pressable
            onPress={() => item.route && router.push(item.route as any)}
            className="flex-row items-center py-2.5 px-2.5 rounded-lg gap-2.5"
            style={[isActive && { backgroundColor: theme.activeBg }]}
        >
            <IconComponent size={20} color={isActive ? theme.activeText : theme.iconColor} />
            <Text className="flex-1 text-[14px] font-medium" style={[{ color: isActive ? theme.activeText : theme.text }]}>
                {item.label}
            </Text>
        </Pressable>
    );
}

// ─── Theme Helper ────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        text: isDark ? '#e5e5e5' : '#1a1a1a',
        textSecondary: isDark ? '#888' : '#666',
        iconColor: isDark ? '#aaa' : '#555',
        border: isDark ? '#1f1f1f' : '#eee',
        sectionTitle: isDark ? '#777' : '#999',
        activeBg: isDark ? '#1a1a2e' : '#e8f0fe',
        activeText: isDark ? '#818cf8' : '#1a73e8',
        subActiveBg: isDark ? '#1a1a2e' : '#e8f0fe',
        headerBg: isDark ? '#0a0a0a' : '#ffffff',
        avatarBg: isDark ? '#333' : '#ddd',
    };
}

// ─── Main Sidebar Component ─────────────────────────────────
export default function Sidebar() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const pathname = usePathname();
    const router = useRouter();
    const { setThemePreference, themePreference } = useThemeContext();

    const [userData, setUserData] = React.useState({
        name: '',
        email: '',
        organization: 'DESK CRM'
    });

    useFocusEffect(
        useCallback(() => {
            loadUser();
        }, [])
    );

    const loadUser = async () => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserData({
                    name: `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || 'User',
                    email: user.email || '',
                    organization: user.organization || user.org || 'DESK CRM'
                });
            }
        } catch (e) { }
    };

    const toggleTheme = () => {
        setThemePreference(isDark ? 'light' : 'dark');
    };

    return (
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.bg }]}>
            {/* ─ Header ─ */}
            <View className="flex-row items-center px-4 py-3.5 border-b gap-2.5" style={[{ borderBottomColor: theme.border }]}>
                <View className="w-9 h-9 rounded-lg items-center justify-center mr-2.5" style={[{ backgroundColor: isDark ? '#1f1f3a' : '#e8f0fe' }]}>
                    <Briefcase size={20} color={theme.activeText} />
                </View>
                <View className="flex-1">
                    <Text className="text-[15px] font-bold" style={[{ color: theme.text }]}>DESK CRM</Text>
                    <Text className="text-[12px]" style={[{ color: theme.textSecondary }]}>{userData.organization}</Text>
                </View>
                <Pressable onPress={toggleTheme} className="p-1">
                    {isDark ? (
                        <Sun size={20} color={theme.textSecondary} />
                    ) : (
                        <Moon size={20} color={theme.textSecondary} />
                    )}
                </Pressable>
            </View>

            {/* ─ Menu Sections ─ */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
            >
                {MENU_SECTIONS.map((section) => (
                    <View key={section.title} className="pt-4 px-3">
                        <Text className="text-[12px] font-semibold uppercase tracking-wide mb-1.5 px-2" style={[{ color: theme.sectionTitle }]}>
                            {section.title}
                        </Text>
                        {section.items.map((item) =>
                            item.subItems ? (
                                <CollapsibleMenuItem
                                    key={item.label}
                                    item={item}
                                    theme={theme}
                                    pathname={pathname}
                                />
                            ) : (
                                <FlatMenuItem
                                    key={item.label}
                                    item={item}
                                    theme={theme}
                                    pathname={pathname}
                                />
                            )
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* ─ User Profile ─ */}
            <Pressable
                onPress={() => router.push('/(drawer)/profile' as any)}
                className="flex-row items-center px-4 py-3.5 border-t gap-2.5"
                style={[{ borderTopColor: theme.border }]}
            >
                <View className="w-[34px] h-[34px] rounded-full items-center justify-center" style={[{ backgroundColor: theme.avatarBg }]}>
                    <User size={22} color={theme.textSecondary} />
                </View>
                <View className="flex-1">
                    <Text className="text-[13px] font-semibold" style={[{ color: theme.text }]} numberOfLines={1}>
                        {userData.name}
                    </Text>
                    <Text className="text-[11px]" style={[{ color: theme.textSecondary }]} numberOfLines={1}>
                        {userData.email}
                    </Text>
                </View>
                <ChevronRight size={18} color={theme.textSecondary} />
            </Pressable>
        </SafeAreaView>
    );
}


