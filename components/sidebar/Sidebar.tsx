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
    Settings,
    Sun,
    User,
    Users
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
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
                    { label: 'Customized View', route: '/(drawer)/dashboard/customized' },
                ],
            },
            {
                icon: Users,
                label: 'Lead Directory',
                subItems: [
                    { label: 'Total Leads', route: '/(drawer)/leads' },
                    { label: 'Add New Lead', route: '/(drawer)/add-lead' },
                ],
            },
            {
                icon: Package,
                label: 'Inventory',
                subItems: [
                    { label: 'Projects', route: '/(drawer)/inventory' },
                    { label: 'Add Project', route: '/(drawer)/inventory/new' },
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
            {
                icon: Settings,
                label: 'Settings',
                route: '/(drawer)/settings'
            },
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
                style={[
                    styles.menuItem,
                    isActive && { backgroundColor: theme.activeBg },
                ]}
            >
                <IconComponent size={20} color={isActive ? theme.activeText : theme.iconColor} />
                <Text style={[styles.menuLabel, { color: isActive ? theme.activeText : theme.text }]}>
                    {item.label}
                </Text>
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <ChevronDown size={20} color={theme.textSecondary} />
                </Animated.View>
            </Pressable>

            <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
                <View style={{ marginLeft: 30, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: theme.border, marginTop: 4, marginBottom: 8 }}>
                    {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.route;
                        return (
                            <Pressable
                                key={sub.label}
                                onPress={() => router.push(sub.route as any)}
                                style={[
                                    styles.subItem,
                                    isSubActive && { backgroundColor: theme.subActiveBg },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.subLabel,
                                        { color: isSubActive ? theme.activeText : theme.textSecondary, fontWeight: isSubActive ? '600' : '400' },
                                    ]}
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
            style={[
                styles.menuItem,
                isActive && { backgroundColor: theme.activeBg },
            ]}
        >
            <IconComponent size={20} color={isActive ? theme.activeText : theme.iconColor} />
            <Text style={[styles.menuLabel, { color: isActive ? theme.activeText : theme.text, flex: 1 }]}>
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* ─ Header ─ */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={[styles.logoIcon, { backgroundColor: isDark ? '#1f1f3a' : '#e8f0fe' }]}>
                    <Briefcase size={20} color={theme.activeText} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.appName, { color: theme.text }]}>DESK CRM</Text>
                    <Text style={[styles.orgName, { color: theme.textSecondary }]}>{userData.organization}</Text>
                </View>
                <Pressable onPress={toggleTheme} style={{ padding: 4 }}>
                    {isDark ? (
                        <Sun size={20} color={theme.textSecondary} />
                    ) : (
                        <Moon size={20} color={theme.textSecondary} />
                    )}
                </Pressable>
            </View>

            {/* ─ Menu Sections ─ */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
            >
                {MENU_SECTIONS.map((section) => (
                    <View key={section.title} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>
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
                style={[styles.userProfile, { borderTopColor: theme.border }]}
            >
                <View style={[styles.avatar, { backgroundColor: theme.avatarBg }]}>
                    <User size={22} color={theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                        {userData.name}
                    </Text>
                    <Text style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                        {userData.email}
                    </Text>
                </View>
                <ChevronRight size={18} color={theme.textSecondary} />
            </Pressable>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    logoIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    appName: {
        fontSize: 15,
        fontWeight: '700',
    },
    orgName: {
        fontSize: 12,
    },
    section: {
        paddingTop: 16,
        paddingHorizontal: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        paddingHorizontal: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
        gap: 10,
    },
    menuLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    subItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 2,
    },
    subLabel: {
        fontSize: 14,
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: 1,
        gap: 10,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 13,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 11,
    },
});
