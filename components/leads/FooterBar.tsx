import { useColorScheme } from '@/hooks/use-color-scheme';
import { Filter, Search } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
    onSearchPress: () => void;
    onFilterPress: () => void;
    bottomInset?: number;
};

export default function FooterBar({
    onSearchPress,
    onFilterPress,
    bottomInset = 0,
}: Props) {
    const isDark = useColorScheme() === 'dark';

    const theme = {
        bg: isDark ? '#111' : '#fff',
        border: isDark ? '#222' : '#e2e8f0',
        icon: isDark ? '#fff' : '#1a1a2e',
        divider: isDark ? '#333' : '#e2e8f0',
        shadow: isDark ? '#000' : '#ccc',
    };

    return (
        <View style={[
            styles.container,
            {
                paddingBottom: Math.max(10, bottomInset),
                paddingTop: 10,
                backgroundColor: theme.bg,
                borderColor: theme.border,
                shadowColor: theme.shadow,
            }
        ]}>
            <Pressable style={styles.btn} onPress={onSearchPress}>
                <Search size={24} color={theme.icon} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            <Pressable style={styles.btn} onPress={onFilterPress}>
                <Filter size={24} color={theme.icon} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        // Remove fixed height, let padding define it
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        zIndex: 50,
        // Add shadow for better visibility against list content
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
    },
    btn: {
        padding: 10,
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 24,
    },
});
