import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Building2, LandPlot, MapPin, Menu, RefreshCw, Search } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type Project = {
    _id: string; // adjust based on actual api response if different
    name: string;
    location?: string;
    plotCount?: number | string;
    totalUnits?: number | string;
    property_type?: string;
    created_at?: string;
    [key: string]: any; // Catch other fields
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
        textSecondary: isDark ? '#d8d8d8ff' : '#64748b',
        mapPin: isDark ? '#b61717ff' : '#c80202ff',
        accent: isDark ? '#32be0c' : '#32be0c',
        danger: '#ef4444',
        inputBg: isDark ? '#111111' : '#f1f5f9',
        divider: isDark ? '#333333' : '#cbd5e1',
    };
}

// ─── Components ─────────────────────────────────────────────────────────────────
function ProjectCard({ project, theme, cardWidth }: { project: Project; theme: ReturnType<typeof getTheme>; cardWidth: any }) {
    // Attempt to extract the date from possible API keys
    const rawDate = project.createdAt || project['Created At'] || project.created_at;
    const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
        : '—';

    // Account for capitalized keys based on the screenshot (Name, Location, Property, Blocks, Units, Created At)
    const name = project.Name || project.name || 'Unnamed Project';
    const location = project.Location || project.location || 'Location missing';
    const propertyType = project.Property || project.property_type || project.property || '—';

    // Robust check for units
    let units = project.totalUnits ?? project.total_units ?? project.totalUnit ?? project.unit ?? project.unit_count;
    units = units !== undefined && units !== null && units !== '' ? units : '—';

    // Robust check for blocks
    let blocks = project.blockCount ?? project.block_count ?? project.blockCount ?? project.block ?? project.block_count;
    blocks = blocks !== undefined && blocks !== null && blocks !== '' ? blocks : '—';

    const id = project.id || project.ProjectId || project.Project_ID || (project._id ? project._id.slice(-6).toUpperCase() : 'N/A');

    return (
        <View className="flex-col rounded-2xl border p-4" style={[{ backgroundColor: theme.cardBg, borderColor: theme.border, width: cardWidth }]}>
            {/* Top Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text className="text-[18px] font-semibold flex-1 pr-2" style={[{ color: theme.text }]} numberOfLines={1}>
                    {name}
                </Text>
                <View className='bg-green-500/20 px-2 py-1 rounded-[25px] border border-green-500'>
                    <Text className='text-green-500 font-bold text-xs'>
                        {formattedDate}
                    </Text>
                </View>
            </View>

            {/* Horizontal Divider */}
            <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 12 }} />

            {/* Bottom Section */}
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

            if (!organization) {
                throw new Error("Organization not found in session.");
            }

            const url = `${API_BASE_URL}/api/projects?organization=${encodeURIComponent(organization)}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || `HTTP error ${res.status}`);
            }

            setProjects(data.projects || data.data || []);
        } catch (err: any) {
            console.error('[Projects API Error]:', err);
            setError(err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProjects();
        }, [fetchProjects])
    );

    const filteredProjects = React.useMemo(() => {
        if (!searchQuery.trim()) return projects;
        const q = searchQuery.toLowerCase();
        return projects.filter(p => {
            const name = p.Name || p.name || '';
            return name.toLowerCase().includes(q);
        });
    }, [projects, searchQuery]);

    const { width } = useWindowDimensions();
    const isSmallScreen = width < 600;
    const isTabletLandscape = width >= 900;
    const cardWidth = isSmallScreen ? '100%' : isTabletLandscape ? '32%' : '48%';

    return (
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-3.5 border-b" style={[{ backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5 pl-6">
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5">
                <Text className="text-[18px] font-semibold" style={[{ color: theme.text }]}>Project Listing</Text>
                </Pressable>
            </View>

            <View className="flex-1 px-4 pt-4" style={[{ backgroundColor: theme.bg }]}>
                {/* Search Bar */}
                <View className="flex-row items-center px-3.5 h-12 rounded-lg border mb-5 gap-2.5" style={[{ backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Search size={18} color={theme.textSecondary} />
                    <TextInput
                        className="flex-1 h-full text-[15px]"
                        style={[{ color: theme.text }]}
                        placeholder="Filter By Name"
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                </View>

                {/* List Area */}
                {loading ? (
                    <View className="flex-1 justify-center items-center gap-3">
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text className="text-[15px]" style={[{ color: theme.textSecondary }]}>Loading projects...</Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 justify-center items-center gap-3">
                        <Building2 size={48} color={theme.danger} />
                        <Text className="text-[15px]" style={[{ color: theme.danger }]}>{error}</Text>
                        <Pressable onPress={fetchProjects} className="flex-row items-center gap-1.5 border rounded-lg px-4 py-2 mt-2.5" style={[{ borderColor: theme.accent }]}>
                            <RefreshCw size={14} color={theme.accent} />
                            <Text className="text-[14px] font-medium" style={[{ color: theme.accent }]}>Retry</Text>
                        </Pressable>
                    </View>
                ) : filteredProjects.length === 0 ? (
                    <View className="flex-1 justify-center items-center gap-3">
                        <Building2 size={48} color={theme.textSecondary} />
                        <Text className="text-[15px]" style={[{ color: theme.textSecondary }]}>No projects found</Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: bottom + 20 }}
                    >
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {filteredProjects.map((item, index) => (
                                <ProjectCard
                                    key={item._id || String(index)}
                                    project={item}
                                    theme={theme}
                                    cardWidth={cardWidth}
                                />
                            ))}
                        </View>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}


