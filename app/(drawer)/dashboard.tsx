import ScreenWrapper from '@/components/sidebar/ScreenWrapper';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FontAwesome } from '@expo/vector-icons';
import {
    CirclePlus,
    PhoneOff,
    UserRoundCheck,
    Users,
} from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

// ─── Theme ──────────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#000000' : '#f4f6f9',
        cardBg: isDark ? '#111111' : '#ffffff',
        border: isDark ? '#1e1e1e' : '#e2e8f0',
        text: isDark ? '#ffffff' : '#111111',
        textSecondary: isDark ? '#888888' : '#64748b',
        iconBorder: isDark ? '#ffffff' : '#111111',
        iconColor: isDark ? '#ffffff' : '#111111',
        cardShadow: isDark ? 'transparent' : '#000000',
        chevron: isDark ? '#555555' : '#cccccc',
    };
}

// ─── Card accent colors — each card gets a unique glow ─────────────────────────
const DASHBOARD_ITEMS = [
    {
        id: 'missed-calls',
        title: 'Missed Calls',
        // subtitle: 'Since a few moments ago',
        icon: PhoneOff,
    },
    {
        id: 'unread-whatsapp',
        title: 'Unread WhatsApp',
        //subtitle: 'Since a few moments ago',
        icon: 'whatsapp' as const, // FontAwesome
    },
    {
        id: 'no-future-activity',
        title: 'No Future Activity',
        // subtitle: 'Since a few moments ago',
        icon: Users,
    },
    {
        id: 'assigned-leads',
        title: 'Assigned Leads',
        //subtitle: 'Leads to your team',
        icon: UserRoundCheck,
    },
    {
        id: 'active-prospects',
        title: 'Active Prospects',
        //subtitle: 'Contacts in nurturing stage',
        icon: CirclePlus,
    },
];

// ─── Animated Card ─────────────────────────────────────────────────────────────
function DashboardCard({
    item,
    theme,
    isDark,
    index,
}: {
    item: (typeof DASHBOARD_ITEMS)[0];
    theme: ReturnType<typeof getTheme>;
    isDark: boolean;
    index: number;
}) {
    // Slide-in animation
    const slideAnim = useRef(new Animated.Value(60)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const isWhatsApp = item.id === 'unread-whatsapp';

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                ],
            }}
        >
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    paddingVertical: 18,
                    paddingHorizontal: 18,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.cardBg,
                    // Shadow
                    shadowColor: theme.cardShadow,
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: isDark ? 0 : 2,
                }}
            >
                {/* Icon Circle */}
                <View
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: theme.iconBorder,
                    }}
                >
                    {isWhatsApp ? (
                        <FontAwesome name="whatsapp" size={26} color={theme.iconColor} />
                    ) : (
                        (() => { const Icon = item.icon as React.ComponentType<any>; return <Icon size={24} color={theme.iconColor} strokeWidth={1.5} />; })()
                    )}
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.text,
                        }}
                    >
                        {item.title}
                    </Text>
                </View>

                {/* Chevron */}
                <FontAwesome
                    name="chevron-right"
                    size={14}
                    color={theme.chevron}
                />
            </Pressable>
        </Animated.View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);

    return (
        <ScreenWrapper title="Dashboard" showBackButton={false}>
            <ScrollView
                style={{ flex: 1, width: '100%', backgroundColor: theme.bg }}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 20,
                    paddingBottom: 40,
                    gap: 14,
                }}
                showsVerticalScrollIndicator={false}
            >
                {DASHBOARD_ITEMS.map((item, index) => (
                    <DashboardCard
                        key={item.id}
                        item={item}
                        theme={theme}
                        isDark={isDark}
                        index={index}
                    />
                ))}
            </ScrollView>
        </ScreenWrapper>
    );
}
