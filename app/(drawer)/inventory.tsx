import CustomBottomSheet from '@/components/ui/CustomBottomSheet';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Building2, LandPlot, MapPin, Menu, RefreshCw, RotateCcw, Search } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type Project = {
    _id: string;
    name: string;
    location?: string;
    plotCount?: number | string;
    totalUnits?: number | string;
    property_type?: string;
    created_at?: string;
    [key: string]: any;
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const getApiBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
    return 'http://localhost:5000';
};
const API_BASE_URL = getApiBaseUrl();

// ─── Theme ─────────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#000000' : '#f8f9fa',
        headerBg: isDark ? '#111111' : '#ffffff',
        cardBg: isDark ? '#1a1a1a' : '#ffffff',
        border: isDark ? '#333333' : '#e2e8f0',
        text: isDark ? '#ffffff' : '#1e293b',
        textSecondary: isDark ? '#d8d8d8' : '#64748b',
        mapPin: isDark ? '#b61717' : '#c80202',
        accent: isDark ? '#32be0c' : '#32be0c',
        danger: '#ef4444',
        inputBg: isDark ? '#222222' : '#f4f4f5',
        divider: isDark ? '#333333' : '#cbd5e1',
        fabBg: isDark ? '#222222' : '#000000',
        fabIcon: '#ffffff',
        searchBtnBg: isDark ? '#E5E5E5' : '#000000',
        searchBtnText: isDark ? '#000000' : '#ffffff',
        placeholder: isDark ? '#666' : '#999',
        resetBg: isDark ? '#3b1414' : '#fef2f2',
        resetText: isDark ? '#f87171' : '#ef4444',
        resetBorder: isDark ? '#7f1d1d' : '#fecaca',
    };
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, theme, cardWidth }: { project: Project; theme: ReturnType<typeof getTheme>; cardWidth: any }) {
    const rawDate = project.createdAt || project['Created At'] || project.created_at;
    const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
        : '—';

    const name = project.Name || project.name || 'Unnamed Project';
    const location = project.Location || project.location || 'Location missing';
    const propertyType = project.Property || project.property_type || project.property || '—';

    let units = project.totalUnits ?? project.total_units ?? project.totalUnit ?? project.unit ?? project.unit_count;
    units = units !== undefined && units !== null && units !== '' ? units : '—';

    return (
        <View style={{ backgroundColor: theme.cardBg, borderColor: theme.border, width: cardWidth, borderRadius: 16, borderWidth: 1, padding: 16 }}>
            {/* Top Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', flex: 1, paddingRight: 8 }} numberOfLines={1}>
                    {name}
                </Text>
                <View style={{ backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 25, borderWidth: 1, borderColor: '#22c55e' }}>
                    <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 12 }}>{formattedDate}</Text>
                </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 12 }} />

            {/* Footer Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 }}>
                    <MapPin size={14} color={theme.mapPin} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '500', flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
                        {location}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 4 }}>
                    {propertyType.toLowerCase().includes('plot') ? (
                        <LandPlot size={14} color={theme.text} />
                    ) : (
                        <Building2 size={14} color={theme.text} />
                    )}
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>
                        {propertyType}
                    </Text>
                </View>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                    {units} Units
                </Text>
            </View>
        </View>
    );
}

// ─── Search Bottom Sheet ──────────────────────────────────────────────────────
function SearchSheet({ isOpen, onClose, onSearch, theme }: {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (q: string) => void;
    theme: ReturnType<typeof getTheme>;
}) {
    const [inputValue, setInputValue] = useState('');

    const handleSearch = () => {
        onSearch(inputValue.trim());
        onClose();
    };

    const handleClose = () => {
        setInputValue('');
        onClose();
    };

    return (
        <CustomBottomSheet isOpen={isOpen} onClose={handleClose} title="Search Projects" height={250}>
            <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 52, borderRadius: 12, gap: 10, backgroundColor: theme.inputBg }}>
                    <Search size={20} color={theme.placeholder} />
                    <TextInput
                        style={{ flex: 1, fontSize: 16, height: '100%', color: theme.text }}
                        placeholder="Search by name..."
                        placeholderTextColor={theme.placeholder}
                        value={inputValue}
                        onChangeText={setInputValue}
                        autoCapitalize="none"
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                        autoFocus
                    />
                </View>
                <TouchableOpacity
                    onPress={handleSearch}
                    activeOpacity={0.85}
                    style={{
                        height: 52,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: theme.searchBtnBg,
                    }}
                >
                    <Text style={{ color: theme.searchBtnText, fontSize: 16, fontWeight: '600' }}>Search</Text>
                </TouchableOpacity>
            </View>
        </CustomBottomSheet>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function InventoryScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const navigation = useNavigation();
    const { bottom } = useSafeAreaInsets();

    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            let token = '';
            let organization = '';
            try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                token = (await AsyncStorage.getItem('token')) || '';
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    organization = user.organization || user.org || '';
                }
            } catch (_) { }
            if (!organization) throw new Error('Organization not found in session.');
            const url = `${API_BASE_URL}/api/projects?organization=${encodeURIComponent(organization)}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || `HTTP error ${res.status}`);
            setProjects(data.projects || data.data || []);
        } catch (err: any) {
            console.error('[Projects API Error]:', err);
            setError(err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchProjects(); }, [fetchProjects]));

    const filteredProjects = React.useMemo(() => {
        if (!searchQuery.trim()) return projects;
        const q = searchQuery.toLowerCase().trim();
        return projects.filter(p => (p.Name || p.name || '').toLowerCase().includes(q));
    }, [projects, searchQuery]);

    const handleSearch = (q: string) => setSearchQuery(q);

    const handleReset = () => {
        setSearchQuery('');
        setResetKey(k => k + 1);
    };

    const { width } = useWindowDimensions();
    const isSmallScreen = width < 600;
    const isTabletLandscape = width >= 900;
    const cardWidth = isSmallScreen ? '100%' : isTabletLandscape ? '32%' : '48%';

    const hasActiveSearch = searchQuery.trim().length > 0;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg }} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
                paddingVertical: 14, borderBottomWidth: 1,
                backgroundColor: theme.headerBg, borderBottomColor: theme.border
            }}>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ padding: 6, paddingLeft: 8 }}>
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ padding: 6, flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Project Listing</Text>
                </Pressable>
            </View>

            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                {/* Active search indicator */}
                {hasActiveSearch && (
                    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                            Showing results for <Text style={{ color: theme.text, fontWeight: '600' }}>"{searchQuery}"</Text>
                        </Text>
                    </View>
                )}

                {/* List Area */}
                <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                            <ActivityIndicator size="large" color={theme.accent} />
                            <Text style={{ fontSize: 15, color: theme.textSecondary }}>Loading projects...</Text>
                        </View>
                    ) : error ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                            <Building2 size={48} color={theme.danger} />
                            <Text style={{ fontSize: 15, color: theme.danger, textAlign: 'center' }}>{error}</Text>
                            <Pressable onPress={fetchProjects} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderColor: theme.accent }}>
                                <RefreshCw size={14} color={theme.accent} />
                                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.accent }}>Retry</Text>
                            </Pressable>
                        </View>
                    ) : filteredProjects.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                            <Building2 size={48} color={theme.textSecondary} />
                            <Text style={{ fontSize: 15, color: theme.textSecondary }}>
                                {hasActiveSearch ? `No results for "${searchQuery}"` : 'No projects found'}
                            </Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, gap: 14 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
                                {filteredProjects.map((item, index) => (
                                    <ProjectCard key={item._id || String(index)} project={item} theme={theme} cardWidth={cardWidth} />
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>

            {/* Solid background for Android navigation gesture area */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: bottom > 0 ? bottom : 0,
                    backgroundColor: isDark ? '#000000' : '#f8f9fa',
                    zIndex: 10,
                }}
            />

            {/* Floating Search / Reset FAB */}
            {hasActiveSearch ? (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleReset}
                    style={{
                        position: 'absolute',
                        bottom: (bottom > 0 ? bottom : 10) + 20,
                        right: 20,
                        width: 58,
                        height: 58,
                        borderRadius: 39,
                        backgroundColor: theme.fabBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 10,
                        zIndex: 999,
                        borderWidth: isDark ? 1 : 0,
                        borderColor: '#444',
                    }}
                >
                    <RotateCcw size={24} color={theme.fabIcon} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsSearchOpen(true)}
                    style={{
                        position: 'absolute',
                        bottom: (bottom > 0 ? bottom : 10) + 20,
                        right: 20,
                        width: 58,
                        height: 58,
                        borderRadius: 39,
                        backgroundColor: theme.fabBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 10,
                        zIndex: 999,
                        borderWidth: isDark ? 1 : 0,
                        borderColor: '#444',
                    }}
                >
                    <Search size={24} color={theme.fabIcon} />
                </TouchableOpacity>
            )}

            {/* Search Bottom Sheet */}
            <SearchSheet
                key={resetKey}
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSearch={handleSearch}
                theme={theme}
            />
        </SafeAreaView>
    );
}
