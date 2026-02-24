import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Check, LogOut, Menu, Pencil, Save, User } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
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
            <SafeAreaView style={[styles.container, { backgroundColor: theme.headerBg, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.textSecondary }}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    const renderField = (label: string, key: keyof typeof userData, editable = true) => (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
            {isEditing && editable ? (
                <TextInput
                    value={editData[key]}
                    onChangeText={(text) => setEditData({ ...editData, [key]: text })}
                    style={[styles.fieldInput, {
                        color: theme.text,
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                    }]}
                    placeholderTextColor={theme.textSecondary}
                />
            ) : (
                <Text style={[styles.fieldValue, { color: theme.text }]}>
                    {userData[key] || '—'}
                </Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.headerBg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={styles.backButton}
                >
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
                <Pressable
                    onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                    style={styles.editButton}
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
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatarLarge, { backgroundColor: theme.avatarBg }]}>
                        <User size={48} color={theme.accent} />
                    </View>
                    <Text style={[styles.displayName, { color: theme.text }]}>
                        {userData.first_name} {userData.last_name}
                    </Text>
                    <Text style={[styles.displayRole, { color: theme.textSecondary }]}>
                        {userData.role} • {userData.organization}
                    </Text>
                </View>

                {/* Details Card */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>
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
                        style={[styles.saveButton, { backgroundColor: theme.accent }]}
                    >
                        <Save size={18} color="#fff" />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </Pressable>
                )}

                {/* Logout Button */}
                <Pressable
                    onPress={handleLogout}
                    style={[styles.logoutButton, { borderColor: theme.danger }]}
                >
                    <LogOut size={18} color={theme.danger} />
                    <Text style={[styles.logoutButtonText, { color: theme.danger }]}>
                        Logout
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    editButton: {
        padding: 6,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarLarge: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    displayName: {
        fontSize: 22,
        fontWeight: '700',
    },
    displayRole: {
        fontSize: 14,
        marginTop: 4,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    fieldValue: {
        fontSize: 15,
        fontWeight: '400',
    },
    fieldInput: {
        fontSize: 15,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
        marginBottom: 12,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1.5,
        gap: 8,
    },
    logoutButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
