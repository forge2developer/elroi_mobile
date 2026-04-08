import { useColorScheme } from '@/hooks/use-color-scheme';
import { Filter, RotateCcw, Search } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
    onSearchPress: () => void;
    onFilterPress: () => void;
    onResetPress?: () => void;
    hasActiveFilters?: boolean;
    bottomInset?: number;
};

export default function FooterBar({
    onSearchPress,
    onFilterPress,
    onResetPress,
    hasActiveFilters = false,
    bottomInset = 0,
}: Props) {
    const isDark = useColorScheme() === 'dark';

    const theme = {
        bg: isDark ? '#111' : '#fff',
        border: isDark ? '#222' : '#e2e8f0',
        icon: isDark ? '#fff' : '#1a1a2e',
        divider: isDark ? '#333' : '#e2e8f0',
        shadow: isDark ? '#000' : '#ccc',
        resetBg: isDark ? '#2a2a2a' : '#f1f5f9',
        resetText: isDark ? '#f87171' : '#ef4444',
    };

    return (
        <View
            className="absolute bottom-0 left-0 right-0 w-full flex-row justify-around items-center border-t z-50"
            style={{
                paddingBottom: 6,
                paddingTop: 10,
                backgroundColor: theme.bg,
                borderColor: theme.border,
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 10,
            }}
        >
            <Pressable className="p-2.5 flex-1 items-center" onPress={onSearchPress}>
                <Search size={24} color={theme.icon} />
            </Pressable>

            <View className="w-px h-6" style={{ backgroundColor: theme.divider }} />

            {/* Reset Button — only visible when search or filter is active */}
            {hasActiveFilters && (
                <>
                    <Pressable
                        className="flex-row items-center justify-center gap-1.5 px-4 py-1.5 rounded-full flex-1"
                        //style={{ backgroundColor: theme.resetBg }}
                        onPress={onResetPress}
                    >
                        <RotateCcw size={24} color={theme.resetText} />
                    </Pressable>

                    <View className="w-px h-6" style={{ backgroundColor: theme.divider }} />
                </>
            )}

            <Pressable className="p-2.5 flex-1 items-center" onPress={onFilterPress}>
                <Filter size={24} color={theme.icon} />
            </Pressable>
        </View>
    );
}
