import FilterDrawer from '@/components/leads/FilterDrawer';
import FooterBar from '@/components/leads/FooterBar';
import SearchDrawer from '@/components/leads/SearchDrawer';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, Menu, RefreshCw, Users } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type Lead = {
    lead_id: string;
    profile_id: number;
    name: string;
    campaign: string;
    source: string;
    sub_source: string;
    received: string;
    status?: string;
};

type Filters = {
    name: string;
    source: string;
    sub_source: string;
    campaign: string;
    status: string;
    project: string;
    dateStart: string;
    dateEnd: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

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
        accent: isDark ? '#e5e5e5' : '#1a73e8',
        accentBg: isDark ? '#63636cff' : '#e8f0fe',
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
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: colors.text }]} />
            <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
        </View>
    );
}

function LeadCard({ lead, theme, cardWidth }: { lead: Lead; theme: ReturnType<typeof getTheme>; cardWidth?: any }) {
    const date = lead.received
        ? new Date(lead.received).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        })
        : '—';

    return (
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, shadowColor: theme.shadow, width: cardWidth }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.profileBadge, { backgroundColor: theme.accentBg }]}>
                    <Text style={[styles.profileBadgeText, { color: theme.accent }]}>
                        #{lead.profile_id}
                    </Text>
                </View>
                <Text style={[styles.leadName, { color: theme.text }]} numberOfLines={1}>
                    {lead.name}
                </Text>
                <StatusBadge status={lead.status} />
            </View>

            <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.cardBody}>
                <InfoRow label="Campaign" value={lead.campaign} theme={theme} />
                <InfoRow label="Source" value={lead.source} theme={theme} accent />
                <InfoRow label="Sub Source" value={lead.sub_source} theme={theme} />
                <InfoRow label="Received" value={date} theme={theme} />
            </View>
        </View>
    );
}

function InfoRow({ label, value, theme, accent }: { label: string; value: string; theme: ReturnType<typeof getTheme>; accent?: boolean }) {
    return (
        <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: accent ? theme.accent : theme.text }]} numberOfLines={1}>
                {value || '—'}
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
        name: '', source: '', sub_source: '', campaign: '', status: '', project: '', dateStart: '', dateEnd: ''
    });

    const [globalSearch, setGlobalSearch] = React.useState(''); // Client-side search params
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    // Fetch leads — handles REST JSON gateway in front of gRPC backend
    const fetchLeads = useCallback(async (activeFilters: Filters) => {
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

            // Build request body
            const body: Record<string, any> = { organization };
            const f: Record<string, string> = {};

            // Map filters
            if (activeFilters.name) f.name = activeFilters.name;
            if (activeFilters.source) f.source = activeFilters.source;
            if (activeFilters.sub_source) f.sub_source = activeFilters.sub_source;
            if (activeFilters.campaign) f.campaign = activeFilters.campaign;
            if (activeFilters.status) f.status = activeFilters.status;
            if (activeFilters.project) f.project = activeFilters.project;
            if (activeFilters.dateStart) f.date_start = activeFilters.dateStart;
            if (activeFilters.dateEnd) f.date_end = activeFilters.dateEnd;

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
            console.log('[Leads] fetched', leadsArray.length, 'leads');
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
        // Destructure to separate subSource from unknown properties if any
        const { subSource, ...rest } = filterParams;

        const newFilters: Filters = {
            ...filters,
            ...rest,
            // Map subSource (from Drawer) to sub_source (Filters type)
            sub_source: subSource || filters.sub_source
        };

        setFilters(newFilters);
        setGlobalSearch('');
        fetchLeads(newFilters);
    };

    const handleReset = () => {
        const empty: Filters = { name: '', source: '', sub_source: '', campaign: '', status: '', project: '', dateStart: '', dateEnd: '' };
        setFilters(empty);
        setGlobalSearch('');
        fetchLeads(empty);
    };

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View style={[styles.topBar, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.topTitle, { color: theme.text }]}>All Leads</Text>
                <Pressable style={styles.iconBtn}>
                    <Bell size={20} color={theme.iconColor} />
                </Pressable>
            </View>

            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                {/* List */}
                {loading ? (
                    <View style={styles.centreBox}>
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text style={[styles.stateText, { color: theme.textSecondary }]}>Loading leads…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centreBox}>
                        <Users size={48} color={theme.danger} />
                        <Text style={[styles.stateText, { color: theme.danger }]}>{error}</Text>
                        <Text style={[styles.errorUrl, { color: theme.textSecondary }]}>API: {API_BASE_URL}/grpc/lead/GetAllLeads</Text>
                        <Pressable onPress={() => fetchLeads(filters)} style={[styles.retryBtn, { borderColor: theme.accent }]}>
                            <RefreshCw size={14} color={theme.accent} />
                            <Text style={[styles.retryText, { color: theme.accent }]}>Retry</Text>
                        </Pressable>
                    </View>
                ) : visibleLeads.length === 0 ? (
                    <View style={styles.centreBox}>
                        <Users size={48} color={theme.textSecondary} />
                        <Text style={[styles.stateText, { color: theme.textSecondary }]}>No leads found</Text>
                        {globalSearch ? <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Search: "{globalSearch}"</Text> : null}
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 100 + bottom }]}
                    >
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
                            {visibleLeads.map((item) => (
                                <LeadCard key={item.lead_id} lead={item} theme={theme} cardWidth={cardWidth} />
                            ))}
                        </View>
                        <Text style={[styles.footerText, { color: theme.textSecondary, marginTop: 12 }]}>
                            Showing {visibleLeads.length} entries
                        </Text>
                    </ScrollView>
                )}

                {/* Bottom Footer & Drawers */}
                <FooterBar
                    onSearchPress={() => setIsSearchOpen(true)}
                    onFilterPress={() => setIsFilterOpen(true)}
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

const styles = StyleSheet.create({
    root: { flex: 1 },
    topBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 1, gap: 8,
    },
    menuBtn: { padding: 4 },
    topTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
    iconBtn: { padding: 4 },
    listContent: { padding: 12, gap: 12, paddingBottom: 100 }, // Extra padding for footer
    card: {
        borderRadius: 14, borderWidth: 1, overflow: 'hidden',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
    profileBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    profileBadgeText: { fontSize: 12, fontWeight: '700' },
    leadName: { fontSize: 15, fontWeight: '600', flex: 1 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    
    
    
    cardDivider: { height: 1 },
    cardBody: { padding: 14, gap: 8 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { fontSize: 12, flex: 1 },
    infoValue: { fontSize: 13, fontWeight: '500', flex: 2, textAlign: 'right' },
    centreBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    stateText: { fontSize: 15, textAlign: 'center' },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    retryText: { fontSize: 13, fontWeight: '600' },
    errorUrl: { fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginVertical: 4 },
    footerText: { textAlign: 'center', fontSize: 12, paddingTop: 4, paddingBottom: 8 },
});
