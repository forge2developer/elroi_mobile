import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getUsers, User } from '../../src/services/userService';

export default function UsersExampleScreen() {
    const { role, organization } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            // Check for admin role before aggressively loading data
            const normalizedRole = role?.toLowerCase();
            if (normalizedRole !== 'admin') {
                setLoading(false);
                return;
            }

            if (!organization) {
                setError('Organization is not set in your session.');
                setLoading(false);
                return;
            }

            try {
                // Using the modular userService to fetch users
                const response = await getUsers({ organization, page: 1, limit: 100 });

                // Fallback depending on your backend's exact JSON shape
                const userList = response.users || (Array.isArray(response) ? response : []);
                setUsers(userList);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [role, organization]);

    // Role Guard
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole !== 'admin') {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>Permission Denied</Text>
                <Text style={styles.subText}>You must be an Admin to view this page. Your role is {role || 'Guest'}.</Text>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={{ marginTop: 12, color: '#64748b' }}>Loading users...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.headerArea}>
                <Text style={styles.header}>Admin - User Management</Text>
            </View>
            <FlatList
                data={users}
                keyExtractor={(item, index) => item.id || String(index)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                        <Text style={styles.info}>{item.email} • {item.role}</Text>
                        <Text style={styles.org}>{item.organization}</Text>
                    </View>
                )}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                ListEmptyComponent={
                    <Text style={styles.subText}>No users found for your organization.</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9', padding: 20 },
    container: { flex: 1, backgroundColor: '#f4f6f9' },
    headerArea: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    header: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    errorText: { color: '#ef4444', fontSize: 16, fontWeight: '600', textAlign: 'center' },
    subText: { color: '#64748b', fontSize: 14, marginTop: 8, textAlign: 'center' },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    info: { fontSize: 14, color: '#475569', marginTop: 4 },
    org: { fontSize: 12, color: '#94a3b8', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
});

/**
 * users-example.tsx
 * 
 * Shows how to consume the useAuth() context, securely verify roles,
 * and dispatch centralized API requests via the userService module.
 */
