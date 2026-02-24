
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Bell, Menu, Search } from 'lucide-react-native';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenWrapper({
    title,
    children,
}: {
    title: string;
    children?: React.ReactNode;
}) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const navigation = useNavigation();
    const [searchText, setSearchText] = React.useState('');
    const [searchFocused, setSearchFocused] = React.useState(false);

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



    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.headerBg }]}>
            {/* ─ Top Bar ─ */}
            <View style={[styles.topBar, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                {/* Left: Hamburger + Title */}
                <Pressable
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={styles.menuButton}
                >
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    {title}
                </Text>

                {/* Right: Search + Online + Notification + Theme */}
                <View style={styles.rightControls}>
                    {/* Search Input */}
                    <View style={[
                        styles.searchBox,
                        {
                            backgroundColor: theme.searchBg,
                            borderColor: searchFocused ? theme.accent : theme.searchBorder,
                        },
                    ]} className='border rounded-2xl'>
                        <Search size={18} color={theme.textSecondary} />
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search..."
                            placeholderTextColor={theme.textSecondary}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            style={[styles.searchInput, { color: theme.searchText }]}
                        />
                    </View>

                    {/* Online Status 
                    <View style={[styles.onlineBadge, { backgroundColor: theme.onlineBg }]}>
                        <View style={[styles.onlineDot, { backgroundColor: theme.onlineDot }]} />
                        <Text style={[styles.onlineText, { color: theme.onlineText }]}>offline</Text>
                    </View>*/}

                    {/* Notification Bell */}
                    <Pressable style={styles.iconButton}>
                        <Bell size={22} color={theme.iconColor} />
                    </Pressable>
                </View>
            </View>

            {/* ─ Content ─ */}
            <View style={[styles.content, { backgroundColor: theme.bg }]}>
                {children || (
                    <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
                        {title} screen content
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        gap: 8,
    },
    menuButton: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 'auto',
    },
    rightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 13,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
        minWidth: 120,
    },
    searchInput: {
        fontSize: 13,
        paddingVertical: 2,
        flex: 1,
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 5,
    },
    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    onlineText: {
        fontSize: 12,
        fontWeight: '600',
    },
    iconButton: {
        padding: 6,
        borderRadius: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
});
