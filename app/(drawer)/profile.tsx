import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Check, LogOut, Menu, Pencil, Save, User } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const navigation = useNavigation();

    // User data state (editable)
    const [isEditing, setIsEditing] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [userData, setUserData] = React.useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        organization: '',
    });
    const [editData, setEditData] = React.useState({ ...userData });

    React.useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const data = {
                    first_name: user.first_name || user.firstName || '',
                    last_name: user.last_name || user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    role: user.role || 'Member',
                    organization: user.organization || user.org || 'None',
                };
                setUserData(data);
                setEditData(data);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

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
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const userStr = await AsyncStorage.getItem('user');
            let currentUser = userStr ? JSON.parse(userStr) : {};

            const updatedUser = {
                ...currentUser,
                first_name: editData.first_name,
                last_name: editData.last_name,
                email: editData.email,
                phone: editData.phone,
            };

            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUserData({ ...editData });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
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
                            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                            await AsyncStorage.multiRemove(['token', 'user']);
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
            <SafeAreaView className="flex-1 justify-center items-center" style={[{ backgroundColor: theme.headerBg }]}>
                <Text style={{ color: theme.textSecondary }}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    const renderField = (label: string, key: keyof typeof userData, editable = true) => (
        <View className="mb-4">
            <Text className="text-[12px] font-medium uppercase tracking-wide mb-1.5" style={[{ color: theme.textSecondary }]}>{label}</Text>
            {isEditing && editable ? (
                <TextInput
                    value={editData[key]}
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
                    {userData[key] || '—'}
                </Text>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.headerBg }]}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b" style={[{ backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    className="p-1.5 pl-6"
                >
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5">
                <Text className="flex-1 text-[18px] font-semibold ml-3" style={[{ color: theme.text }]}>Profile</Text>
                </Pressable>
                <Pressable
                    onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="p-1.5 pl-20"
                >
                    {isEditing ? (
                        <Check size={22} color={theme.accent} />
                    ) : (
                        <Pencil size={22} color={theme.accent} />
                    )}
                </Pressable>
            </View>

            <ScrollView
                style={{ backgroundColor: theme.bg }}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <View className="items-center py-6">
                    <View className="w-[88px] h-[88px] rounded-full items-center justify-center mb-3.5" style={[{ backgroundColor: theme.avatarBg }]}>
                        <User size={48} color={theme.accent} />
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
        </SafeAreaView>
    );
}


