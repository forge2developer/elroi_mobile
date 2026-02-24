import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, Menu, Plus, RefreshCw, Search, User, Users } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type UserProfile = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    organization: string;
    status?: string;
    teams?: string | string[];
};

// ─── Constants ─────────────────────────────────────────────────────────────────
import { BASE_URL as API_BASE_URL } from '../../src/config/apiConfig';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    Admin: { bg: '#1e3a5f', text: '#60a5fa' },
    Manager: { bg: '#3b2c00', text: '#fbbf24' },
    Member: { bg: '#2e1a4a', text: '#a78bfa' },
    Staff: { bg: '#0a3624', text: '#34d399' },
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
        accent: isDark ? '#e5e5e5' : '#000000ff',
        accentBg: isDark ? '#63636cff' : '#e8f0fe',
        danger: '#ef4444',
        iconColor: isDark ? '#aaaaaa' : '#555555',
        divider: isDark ? '#1e1e1e' : '#f1f5f9',
        shadow: isDark ? 'transparent' : '#e2e8f0',
        text2: isDark ? '#000000ff' : '#ffffffff',
    };
}

// ─── Components ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role?: string }) {
    if (!role) return null;
    const colors = ROLE_COLORS[role] ?? { bg: '#333', text: '#aaa' };
    return (
        <View className="flex-row items-center px-2 py-0.5 rounded-full gap-1" style={[{ backgroundColor: colors.bg }]}>
            <View className="w-1.5 h-1.5 rounded-full" style={[{ backgroundColor: colors.text }]} />
            <Text className="text-[11px] font-semibold" style={[{ color: colors.text }]}>{role}</Text>
        </View>
    );
}

// ─── Removed UserCard and InfoRow in favor of Table layout ───

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function UserManagementScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const navigation = useNavigation();
    const { bottom } = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    // State
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isAdmin, setIsAdmin] = React.useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            let token = '';
            let organization = '';
            let localUser: any = {};
            try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                token = (await AsyncStorage.getItem('token')) || '';
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    localUser = JSON.parse(userStr);
                    organization = localUser.organization || localUser.org || '';

                    // Check if the user role is Admin to toggle permissions
                    const role = (localUser.role || '').toLowerCase();
                    setIsAdmin(role === 'admin' || role === 'owner' || role === 'superadmin');
                }
            } catch (_) { }

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            // Attempt 1: Fetch Members with Teams
            try {
                // Changing to /api/teams/users as per Swagger to get teams details
                const url = `${API_BASE_URL}/api/teams/users`;
                console.log('[UserManagement] Trying GET', url);
                const res = await fetch(url, { headers });
                if (res.ok) {
                    const data = await res.json();

                    // The response might be { status: 'success', data: [...] } or just an array
                    const list = data.data || data.users || (Array.isArray(data) ? data : []);

                    if (list.length > 0) {
                        setUsers(list);
                        return;
                    }
                } else {
                    console.log('[UserManagement] GET /api/teams/users returned', res.status);
                }
            } catch (e) { console.log('[UserManagement] GET /api/teams/users failed'); }

            // Attempt 2: gRPC Gateway POST Pattern
            try {
                const url = `${API_BASE_URL}/grpc/user/GetAllUsers`;
                console.log('[UserManagement] Trying POST', url);
                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ organization }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = data.users || data.Users || data.user_list || [];
                    if (list.length > 0) {
                        setUsers(list);
                        return;
                    }
                }
            } catch (e) { console.log('[UserManagement] POST /grpc/user/GetAllUsers failed'); }

            // Attempt 3: Singular profile fallback
            try {
                const meUrl = `${API_BASE_URL}/api/users/me`;
                console.log('[UserManagement] Trying GET', meUrl);
                const meRes = await fetch(meUrl, { headers });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    const userObj = meData.data || meData.user || meData;
                    const profile = {
                        id: userObj.id || userObj.profile_id || localUser.id || 'me',
                        first_name: userObj.first_name || userObj.firstName || localUser.first_name || localUser.firstName || '',
                        last_name: userObj.last_name || userObj.lastName || localUser.last_name || localUser.lastName || '',
                        email: userObj.email || localUser.email || '',
                        phone: userObj.phone || localUser.phone || '',
                        role: userObj.role || localUser.role || 'Admin',
                        organization: userObj.organization || userObj.org || localUser.organization || localUser.org || organization || 'My Org',
                        status: userObj.status || localUser.status || 'Active',
                        teams: userObj.teams || localUser.teams || ''
                    };
                    setUsers([profile]);
                    return;
                }
            } catch (e) { console.log('[UserManagement] GET /api/users/me failed'); }

            // Attempt 4: Local Storage User Profile
            if (localUser && (localUser.first_name || localUser.firstName || localUser.email)) {
                console.log('[UserManagement] Falling back to local user profile');
                const profile = {
                    id: localUser.id || localUser.profile_id || 'me',
                    first_name: localUser.first_name || localUser.firstName || '',
                    last_name: localUser.last_name || localUser.lastName || '',
                    email: localUser.email || '',
                    phone: localUser.phone || '',
                    role: localUser.role || 'Admin',
                    organization: localUser.organization || localUser.org || organization || 'My Org',
                    status: localUser.status || 'Active',
                    teams: localUser.teams || ''
                };
                setUsers([profile]);
                return;
            }

            throw new Error(`Failed to fetch user data. Please check if the server is running at ${API_BASE_URL}`);
        } catch (err: any) {
            console.error('[UserManagement] Final Error:', err.message);
            setError(err.message || 'No users could be loaded.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
        }, [fetchUsers])
    );

    const filteredUsers = React.useMemo(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase();
        return users.filter(u => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
            return fullName.includes(q) || (u.email || '').toLowerCase().includes(q);
        });
    }, [users, searchQuery]);

    return (
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View className="flex-row items-center px-3 py-2.5 border-b gap-2" style={[{ backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1">
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Text className="text-[17px] font-bold flex-1" style={[{ color: theme.text }]}>User Management</Text>
                <Pressable className="p-1">
                    <Bell size={20} color={theme.iconColor} />
                </Pressable>
            </View>

            <View className="flex-1" style={[{ backgroundColor: theme.bg }]}>
                {/* Search & Actions Bar */}
                <View className="px-3 pt-3 pb-1 flex-row items-center gap-2">
                    <View
                        className="flex-1 flex-row items-center px-3 h-11.5
                         rounded-xl border"
                        style={[{ backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    >
                        <Search size={16} color={theme.iconColor} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name or email..."
                            placeholderTextColor={theme.textSecondary}
                            className="flex-1 ml-2 text-[14px]"
                            style={[{ color: theme.text }]}
                        />
                    </View>

                    {isAdmin && (
                        <Pressable
                            className="h-9 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
                            style={[{ backgroundColor: theme.accent }]}
                            onPress={() => {
                                // navigation.navigate('add-user'); // Add navigation later
                            }}
                        >
                            <Text className="text-[12px] font-semibold" style={[{ color: theme.text2 }]}>Add User</Text>
                        </Pressable>
                    )}
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center gap-3 p-8">
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text className="text-[15px] text-center" style={[{ color: theme.textSecondary }]}>Loading users…</Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center gap-3 p-8">
                        <Users size={48} color={theme.danger} />
                        <Text className="text-[15px] text-center" style={[{ color: theme.danger }]}>{error}</Text>
                        <Pressable
                            onPress={() => fetchUsers()}
                            className="flex-row items-center gap-1.5 border rounded-xl px-4 py-2"
                            style={[{ borderColor: theme.accent }]}
                        >
                            <RefreshCw size={14} color={theme.accent} />
                            <Text className="text-[13px] font-semibold" style={[{ color: theme.accent }]}>Retry</Text>
                        </Pressable>
                    </View>
                ) : users.length === 0 ? (
                    <View className="flex-1 items-center justify-center gap-3 p-8">
                        <Users size={48} color={theme.textSecondary} />
                        <Text className="text-[15px] text-center" style={[{ color: theme.textSecondary }]}>No users found</Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 12, paddingBottom: 40 + bottom }}
                    >
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <View className="bg-transparent rounded-xl border overflow-hidden p-4" style={[{ backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                                {/* Table Header */}
                                <View className="flex-row border-b pb-3 mb-2" style={[{ borderBottomColor: theme.divider }]}>
                                    <Text className="w-56 font-bold text-[13px]" style={[{ color: theme.textSecondary }]}>Name</Text>
                                    <Text className="w-64 font-bold text-[13px]" style={[{ color: theme.textSecondary }]}>Email</Text>
                                    <Text className="w-36 font-bold text-[13px]" style={[{ color: theme.textSecondary }]}>Phone</Text>
                                    <Text className="w-28 font-bold text-[13px]" style={[{ color: theme.textSecondary }]}>Role</Text>
                                    <Text className="w-40 font-bold text-[13px]" style={[{ color: theme.textSecondary }]}>Organization</Text>
                                    <Text className="w-28 font-bold text-[13px]" style={[{ color: theme.textSecondary }]}>Status</Text>
                                    <Text className="w-56 font-bold text-[13px]" style={[{ color: theme.textSecondary }]}>Teams</Text>
                                </View>

                                {/* Table Rows */}
                                {filteredUsers.map((item, idx) => (
                                    <View key={item.id || idx} className="flex-row items-center border-b py-3" style={[{ borderBottomColor: theme.divider }]}>
                                        <View className="w-56 flex-row items-center gap-3 pr-4">
                                            <View className="w-8 h-8 rounded-full justify-center items-center" style={[{ backgroundColor: theme.accentBg }]}>
                                                <User size={16} color={theme.accent} />
                                            </View>
                                            <Text className="text-[14.5px] font-semibold flex-1" style={[{ color: theme.text }]} numberOfLines={1}>
                                                {item.first_name} {item.last_name}
                                            </Text>
                                        </View>
                                        <Text className="w-64 text-[13.5px] pr-4" style={[{ color: theme.textSecondary }]} numberOfLines={1}>{item.email || '—'}</Text>
                                        <Text className="w-36 text-[13.5px] pr-4" style={[{ color: theme.accent }]} numberOfLines={1}>{item.phone || '—'}</Text>
                                        <View className="w-28 pr-4 items-start">
                                            <RoleBadge role={item.role} />
                                        </View>
                                        <Text className="w-40 text-[13.5px] pr-4" style={[{ color: theme.text }]} numberOfLines={1}>{item.organization || '—'}</Text>
                                        <Text className="w-28 text-[13.5px] pr-4" style={[{ color: theme.text }]} numberOfLines={1}>{item.status || 'Active'}</Text>
                                        <Text className="w-56 text-[13.5px] pr-4" style={[{ color: theme.text }]} numberOfLines={1}>{Array.isArray(item.teams) ? item.teams.join(', ') : (item.teams || '—')}</Text>
                                    </View>
                                ))}
                                {filteredUsers.length === 0 && !loading && (
                                    <Text className="w-full text-center py-6 text-[14px]" style={[{ color: theme.textSecondary }]}>
                                        No users match your search.
                                    </Text>
                                )}
                            </View>
                        </ScrollView>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}
