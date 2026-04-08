import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Check, LogOut, Menu, Pencil, Save, User } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    BackHandler,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenWrapper from '@/components/sidebar/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';
import { BASE_URL } from '@/src/config/apiConfig';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const navigation = useNavigation();
    const { token, name, email, role, organization, profileImage, logout, updateProfile } = useAuth();
    
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (role === 'admin' || role === 'manager') {
                    router.replace('/(drawer)/Master_dashboard');
                } else {
                    router.replace('/(drawer)/dashboard');
                }
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [role, router])
    );
    
    // Helper to fix image URLs for development (relative paths or localhost)
    const formatProfileImage = (path: string | null) => {
        if (!path) return null;
        if (!path.startsWith('http')) {
            return `${BASE_URL}${path}`;
        }
        // Dev fix: Replace localhost with actual server IP if needed
        if (path.includes('localhost') || path.includes('127.0.0.1')) {
            return path.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/, BASE_URL);
        }
        return path;
    };

    // User data state (editable)
    const [isEditing, setIsEditing] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    
    const [userData, setUserData] = React.useState({
        first_name: name?.split(' ')[0] || '',
        last_name: name?.split(' ').slice(1).join(' ') || '',
        email: email || '',
        phone: '',
        role: role || 'Member',
        organization: organization || 'None',
        profileImage: formatProfileImage(profileImage ?? null)
    });
    
    const [editData, setEditData] = React.useState({ ...userData });

    // Synchronization effect on mount
    React.useEffect(() => {
        const syncProfile = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${BASE_URL}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && data.data) {
                    const user = data.data;
                    const profile = user.profile || {};
                    
                    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
                    const emailAddr = profile.email || '';
                    const rawImg = profile.profileImagePath || null;
                    const formattedImg = formatProfileImage(rawImg);

                    // Update UI state
                    const syncData = {
                        first_name: profile.firstName || '',
                        last_name: profile.lastName || '',
                        email: emailAddr,
                        phone: profile.phone || '',
                        role: user.role || 'Member',
                        organization: user.organization || 'None',
                        profileImage: formattedImg
                    };
                    setUserData(syncData);
                    setEditData(syncData);

                    // Update Global Session
                    await updateProfile({
                        name: fullName,
                        email: emailAddr,
                        profileImage: formattedImg ?? undefined
                    });
                }
            } catch (err) {
                console.error('[Profile Sync] Failed:', err);
            }
        };

        syncProfile();
    }, [token]);

    const theme = {
        bg: isDark ? '#000' : '#fff',
        headerBg: isDark ? '#111' : '#fff',
        card: isDark ? '#111' : '#f5f5f5',
        border: isDark ? '#222' : '#e5e5e5',
        text: isDark ? '#f0f0f0' : '#111',
        textSecondary: isDark ? '#888' : '#666',
        inputBg: isDark ? '#1a1a1a' : '#fff',
        inputBorder: isDark ? '#333' : '#ddd',
        accent: isDark ? '#818cf8' : '#1a73e8',
        danger: '#ef4444',
        avatarBg: isDark ? '#1f1f3a' : '#e8f0fe',
    };

    const handleSave = async () => {
        try {
            // Updated to use Global context
            await updateProfile({
                name: `${editData.first_name} ${editData.last_name}`.trim(),
                email: editData.email,
                profileImage: editData.profileImage || undefined
            });
            setUserData({ ...editData });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated locally. Cloud sync pending...');
        } catch (error) {
            Alert.alert('Error', 'Failed to save changes');
        }
    };

    const handleCancel = () => {
        setEditData({ ...userData });
        setIsEditing(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/auth/login');
                        } catch (error) {
                            Alert.alert('Error', 'Logout failed');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <ScreenWrapper title="Profile" showBackButton={false}>
                <View className="flex-1 justify-center items-center" style={[{ backgroundColor: theme.headerBg }]}>
                    <Text style={{ color: theme.textSecondary }}>Loading profile...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    const renderField = (label: string, key: keyof typeof userData, editable = true) => (
        <View className="mb-4">
            <Text className="text-[12px] font-medium uppercase tracking-wide mb-1.5" style={[{ color: theme.textSecondary }]}>{label}</Text>
            {isEditing && editable ? (
                <TextInput
                    value={editData[key] as string}
                    onChangeText={(text) => setEditData({ ...editData, [key]: text })}
                    className="text-[15px] border rounded-lg px-3 py-2.5"
                    style={[{
                        color: theme.text,
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                    }]}
                    placeholderTextColor={theme.textSecondary}
                />
            ) : (
                <Text className="text-[15px]" style={[{ color: theme.text }]}>
                    {(userData[key] as string) || '—'}
                </Text>
            )}
        </View>
    );

    return (
        <ScreenWrapper title="Profile" showBackButton={false}>

            <ScrollView
                style={{ backgroundColor: theme.bg }}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <View className="items-center py-6">
                    <View className="w-[88px] h-[88px] rounded-full items-center justify-center mb-3.5 overflow-hidden" style={[{ backgroundColor: theme.avatarBg }]}>
                        {userData.profileImage ? (
                            <Image 
                                source={{ uri: userData.profileImage }} 
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <User size={48} color={theme.accent} />
                        )}
                    </View>
                    <Text className="text-[22px] font-bold" style={[{ color: theme.text }]}>
                        {userData.first_name} {userData.last_name}
                    </Text>
                    <Text className="text-[14px] mt-1" style={[{ color: theme.textSecondary }]}>
                        {userData.role} • {userData.organization}
                    </Text>
                </View>

                {/* Details Card */}
                <View className="rounded-xl border p-4 mb-5" style={[{ backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-[16px] font-semibold" style={[{ color: theme.text }]}>
                            Personal Information
                        </Text>
                        {isEditing && (
                            <Pressable onPress={handleCancel}>
                                <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '500' }}>
                                    Cancel
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {renderField('First Name', 'first_name')}
                    {renderField('Last Name', 'last_name')}
                    {renderField('Email', 'email')}
                    {renderField('Phone', 'phone')}
                    {renderField('Role', 'role', false)}
                    {renderField('Organization', 'organization', false)}
                </View>

                {/* Save Button (when editing) */}
                {isEditing && (
                    <Pressable
                        onPress={handleSave}
                        className="flex-row items-center justify-center py-3.5 rounded-xl gap-2 mb-3"
                        style={[{ backgroundColor: theme.accent }]}
                    >
                        <Save size={18} color="#fff" />
                        <Text className="text-white text-[15px] font-semibold">Save Changes</Text>
                    </Pressable>
                )}

                {/* Logout Button */}
                <Pressable
                    onPress={handleLogout}
                    className="flex-row items-center justify-center py-3.5 rounded-xl border-[1.5px] gap-2"
                    style={[{ borderColor: theme.danger }]}
                >
                    <LogOut size={18} color={theme.danger} />
                    <Text className="text-[15px] font-semibold" style={[{ color: theme.danger }]}>
                        Logout
                    </Text>
                </Pressable>
            </ScrollView>
        </ScreenWrapper>
    );
}


