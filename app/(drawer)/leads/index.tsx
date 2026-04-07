import FilterDrawer from '@/components/leads/FilterDrawer';
import FooterBar from '@/components/leads/FooterBar';
import SearchDrawer from '@/components/leads/SearchDrawer';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Menu, RefreshCw, Users } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Pressable,
    
    ScrollView,
    Text,
    View,
    useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Lead = {
    _id?: string;
    lead_id: string;
    profile_id: number;
    name: string;
    campaign: string;
    source: string;
    sub_source: string;
    received: string;
    status?: string;
    stage?: string;
    exe_user?: string;
    exe_user_name?: string;
};

type Filters = {
    name: string;
    source: string;
    sub_source: string;
    campaign: string;
    status: string;
    stage: string;
    project: string;
    dateStart: string;
    dateEnd: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────
import { BASE_URL } from '@/src/config/apiConfig';
const API_BASE_URL = BASE_URL;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    New: { bg: '#1e3a5f', text: '#60a5fa' },
    Contacted: { bg: '#3b2c00', text: '#fbbf24' },
    Qualified: { bg: '#2e1a4a', text: '#a78bfa' },
    Converted: { bg: '#0a3624', text: '#34d399' },
    Closed: { bg: '#3b1414', text: '#f87171' },
};

// ─── Theme ─────────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#0a0a0a' : '#f4f6f9',
        headerBg: isDark ? '#111111' : '#ffffff',
        cardBg: isDark ? '#161616' : '#ffffff',
        border: isDark ? '#222222' : '#e2e8f0',
        text: isDark ? '#e5e5e5' : '#1a1a2e',
        textSecondary: isDark ? '#888888' : '#64748b',
        accent: isDark ? '#ffffffff' : '#000000ff',
        accentBg: isDark ? '#37373cff' : '#e8f4f4ff',
        danger: '#ef4444',
        iconColor: isDark ? '#aaaaaa' : '#555555',
        divider: isDark ? '#1e1e1e' : '#f1f5f9',
        shadow: isDark ? 'transparent' : '#e2e8f0',

    };
}

// ─── Components ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
    if (!status) return null;
    const colors = STATUS_COLORS[status] ?? { bg: '#333', text: '#aaa' };
    return (
        <View className="flex-row items-center px-2 py-0.5 rounded-full gap-1 bg-black dark:bg-white">
            <View className="w-1.5 h-1.5 rounded-full" style={[{ backgroundColor: colors.text }]} />
            <Text className="text-[11px] font-semibold" style={[{ color: colors.text }]}>{status}</Text>
        </View>
    );
}

function LeadCard({ lead, theme, cardWidth }: { lead: Lead; theme: ReturnType<typeof getTheme>; cardWidth?: any }) {
    const router = require('expo-router').useRouter();
    const date = lead.received
        ? new Date(lead.received).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        })
        : '—';

    return (
        <Pressable
            onPress={() => router.push({ pathname: '/(drawer)/leads/lead_detail', params: { id: lead._id || lead.lead_id, from: 'leads' } })}
            className="rounded-xl border overflow-hidden"
            style={[{
                backgroundColor: theme.cardBg, borderColor: theme.border, shadowColor: theme.shadow, width: cardWidth,
                shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2
            }]}
        >
            <View className="flex-row items-center gap-2 px-3.5 py-3">
                <View className="px-2 py-0.5 rounded-lg" style={[{ backgroundColor: theme.accentBg }]}>
                    <Text className="text-[12px] font-bold" style={[{ color: theme.accent }]}>#{lead.profile_id}</Text>
                </View>
                <Text className="text-[15px] font-semibold flex-1" style={[{ color: theme.text }]} numberOfLines={1}>
                    {lead.name}
                </Text>
                <StatusBadge status={lead.stage || lead.status} />
            </View>

            <View className="h-px" style={[{ backgroundColor: theme.divider }]} />
            <View className="p-3.5 gap-2">
                <InfoRow label="Executive" value={lead.exe_user_name || "Unassigned"} theme={theme} accent />
                <View className="h-px opacity-20" style={[{ backgroundColor: theme.textSecondary }]} />
                <InfoRow label="Campaign" value={lead.campaign} theme={theme} />
                <InfoRow label="Source" value={lead.source} theme={theme} />
                <InfoRow label="Sub Source" value={lead.sub_source} theme={theme} />
                <InfoRow label="Received" value={date} theme={theme} />
            </View>
        </Pressable>
    );
}

function InfoRow({ label, value, theme, accent }: { label: string; value: string; theme: ReturnType<typeof getTheme>; accent?: boolean }) {
    return (
        <View className="flex-row justify-between items-center">
            <Text className="text-[12px] flex-1" style={[{ color: theme.textSecondary }]}>{label}</Text>
            <Text className="text-[13px] font-medium flex-[2] text-right" style={[{ color: accent ? theme.accent : theme.text }]} numberOfLines={1}>
                {value || '—'}
            </Text>
        </View>
    );
}

function StatItem({ label, value, theme, color }: { label: string; value: number; theme: any; color: string }) {
    return (
        <View
            className="p-5 rounded-[24px] border min-w-[160px] shadow-sm"
            style={[{ 
                backgroundColor: theme.cardBg, 
                borderColor: theme.border,
                shadowColor: color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3
            }]}
        >
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[28px] font-black" style={[{ color }]}>
                    {value}
                </Text>
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            </View>
            <Text className="text-[10px] font-black uppercase tracking-[1.5px] leading-4" style={[{ color: theme.textSecondary }]}>
                {label.split(' ').join('\n')}
            </Text>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function LeadsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const navigation = useNavigation();
    const { bottom } = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isSmallScreen = width < 900;
    const isTabletLandscape = width >= 900;
    const cardWidth = isSmallScreen ? '100%' : '48%';

    // State
    const [leads, setLeads] = React.useState<Lead[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [filters, setFilters] = React.useState<Filters>({
        name: '', source: '', sub_source: '', campaign: '', status: '', stage: '', project: '', dateStart: '', dateEnd: ''
    });

    const [globalSearch, setGlobalSearch] = React.useState(''); // Client-side search params
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const { organization: authOrg, token: authToken, userId: authUserId } = useAuth();

    // Fetch leads — handles REST JSON gateway in front of gRPC backend
    const fetchLeads = useCallback(async (activeFilters: Filters) => {
        try {
            setLoading(true);
            setError('');

            const organization = authOrg || '';
            const token = authToken || '';
            const currentUserId = authUserId || '';

            if (!organization) {
                console.error('[Leads] Aborting: No organization found in session context.');
                setLeads([]);
                setLoading(false);
                return;
            }

            console.log('[Leads] Fetching for:', organization);

            // Build request body
            const body: Record<string, any> = { organization, userId: currentUserId };
            const f: Record<string, string> = {};

            // Map filters
            if (activeFilters.name) f.name = activeFilters.name;
            if (activeFilters.source) f.source = activeFilters.source;
            if (activeFilters.sub_source) f.sub_source = activeFilters.sub_source;
            if (activeFilters.campaign) f.campaign = activeFilters.campaign;
            if (activeFilters.status) f.status = activeFilters.status;
            if (activeFilters.stage) f.stage = activeFilters.stage;
            if (activeFilters.project) f.project = activeFilters.project;
            if (activeFilters.dateStart && activeFilters.dateStart.trim() !== '') {
                f.date_start = activeFilters.dateStart;
                f.start_date = activeFilters.dateStart;
                f.startDate = activeFilters.dateStart;
            }
            if (activeFilters.dateEnd && activeFilters.dateEnd.trim() !== '') {
                f.date_end = activeFilters.dateEnd;
                f.end_date = activeFilters.dateEnd;
                f.endDate = activeFilters.dateEnd;
            }

            if (Object.keys(f).length) body.filters = f;

            // Updated endpoint based on user documentation
            const url = `${API_BASE_URL}/grpc/lead/GetAllLeads`;
            console.log('[Leads] POST', url, JSON.stringify(body));

            let res: Response;
            try {
                res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(body),
                });
            } catch (netErr: any) {
                throw new Error(`Network error: ${netErr.message || 'Cannot reach'} ${url}`);
            }

            let data: any = {};
            const rawText = await res.text();
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                if (!res.ok) throw new Error(`Server error ${res.status}: ${rawText.slice(0, 200)}`);
            }

            if (!res.ok) {
                const msg = data?.message || data?.error || data?.detail || `HTTP ${res.status}: ${JSON.stringify(data)}`; // Improved logging
                throw new Error(msg);
            }

            const leadsArray = data.leads || data.Leads || data.lead_list || [];
            console.log('[Leads] fetched', leadsArray.length, 'total');
            setLeads(leadsArray);
        } catch (err: any) {
            console.error('[Leads] error:', err.message);
            setError(err.message || 'Failed to load leads.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchLeads(filters);
        }, [fetchLeads, filters])
    );


    // Client-side global search (Name, Source, Campaign)
    const visibleLeads = React.useMemo(() => {
        if (!globalSearch.trim()) return leads;
        const q = globalSearch.toLowerCase();
        return leads.filter(l =>
            (l.name && l.name.toLowerCase().includes(q)) ||
            (l.source && l.source.toLowerCase().includes(q)) ||
            (l.campaign && l.campaign.toLowerCase().includes(q))
        );
    }, [leads, globalSearch]);

    const handleSearch = (searchParams: { name: string }) => {
        setGlobalSearch(searchParams.name);
    };

    const handleFilter = (filterParams: any) => {
        // Filter triggers API fetch
        const newFilters: Filters = {
            ...filters,
            ...filterParams,
            // Map subSource (from Drawer camelCase) to sub_source
            sub_source: filterParams.subSource || filterParams.sub_source || filters.sub_source
        };

        setFilters(newFilters);
        setGlobalSearch('');
        fetchLeads(newFilters);
    };

    const handleReset = () => {
        const empty: Filters = { name: '', source: '', sub_source: '', campaign: '', status: '', stage: '', project: '', dateStart: '', dateEnd: '' };
        setFilters(empty);
        setGlobalSearch('');
        fetchLeads(empty);
    };

    return (
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View className="flex-row items-center px-3 py-2.5 border-b gap-2" style={[{ backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5 pl-6">
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5">
                    <Text className="text-[17px] font-bold flex-1" style={[{ color: theme.text }]}>All Leads</Text>
                </Pressable>
                {/*<Pressable className="p-1">
                    <Bell size={20} color={theme.iconColor} />
                </Pressable>*/}
            </View>

            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                {/* List */}
                {loading ? (
                    <View className="flex-1 items-center justify-center gap-3 p-8">
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text className="text-[15px] text-center" style={[{ color: theme.textSecondary }]}>Loading leads…</Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center gap-3 p-8">
                        <Users size={48} color={theme.danger} />
                        <Text className="text-[15px] text-center" style={[{ color: theme.danger }]}>{error}</Text>
                        <Text className="text-[11px] text-center my-1" style={[{ color: theme.textSecondary, fontFamily: 'monospace' }]}>API: {API_BASE_URL}/grpc/lead/GetAllLeads</Text>
                        <Pressable onPress={() => fetchLeads(filters)} className="flex-row items-center gap-1.5 border rounded-xl px-4 py-2" style={[{ borderColor: theme.accent }]}>
                            <RefreshCw size={14} color={theme.accent} />
                            <Text className="text-[13px] font-semibold" style={[{ color: theme.accent }]}>Retry</Text>
                        </Pressable>
                    </View>
                ) : visibleLeads.length === 0 ? (
                    <View className="flex-1 items-center justify-center gap-3 p-8">
                        <Users size={48} color={theme.textSecondary} />
                        <Text className="text-[15px] text-center" style={[{ color: theme.textSecondary }]}>No leads found</Text>
                        {globalSearch ? <Text className="mt-2" style={{ color: theme.textSecondary }}>Search: "{globalSearch}"</Text> : null}
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 12, paddingBottom: 100 + bottom }}
                    >
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
                            {visibleLeads.map((item) => (
                                <LeadCard key={item.lead_id} lead={item} theme={theme} cardWidth={cardWidth} />
                            ))}
                        </View>
                    </ScrollView>
                )}

                {/* Bottom Footer & Drawers */}
                <FooterBar
                    onSearchPress={() => setIsSearchOpen(true)}
                    onFilterPress={() => setIsFilterOpen(true)}
                    onResetPress={handleReset}
                    hasActiveFilters={
                        !!globalSearch ||
                        !!filters.name || !!filters.source || !!filters.sub_source ||
                        !!filters.campaign || !!filters.status || !!filters.project ||
                        !!filters.dateStart || !!filters.dateEnd
                    }
                    bottomInset={bottom}
                />

                <SearchDrawer
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onSearch={handleSearch}
                    initialValues={{ name: globalSearch }}
                />

                <FilterDrawer
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    onApply={handleFilter}
                    onReset={handleReset}
                    initialValues={{ ...filters, subSource: filters.sub_source }}
                />
            </View>
        </SafeAreaView>
    );
}
