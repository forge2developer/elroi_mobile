import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
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
            <SafeAreaView className="flex-1 justify-center items-center bg-[#f4f6f9] p-5">
                <Text className="text-[#ef4444] text-[16px] font-semibold text-center">Permission Denied</Text>
                <Text className="text-[#64748b] text-[14px] mt-2 text-center">You must be an Admin to view this page. Your role is {role || 'Guest'}.</Text>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-[#f4f6f9] p-5">
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text className="mt-3 text-[#64748b]">Loading users...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-[#f4f6f9] p-5">
                <Text className="text-[#ef4444] text-[16px] font-semibold text-center">{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#f4f6f9]" edges={['top', 'left', 'right']}>
            <View className="px-4 py-3 bg-white border-b border-[#e2e8f0]">
                <Text className="text-[20px] font-bold text-[#1e293b]">Admin - User Management</Text>
            </View>
            <FlatList
                data={users}
                keyExtractor={(item, index) => item.id || String(index)}
                renderItem={({ item }) => (
                    <View className="bg-white p-4 rounded-xl border border-[#e2e8f0]">
                        <Text className="text-[16px] font-bold text-[#0f172a]">{item.first_name} {item.last_name}</Text>
                        <Text className="text-[14px] text-[#475569] mt-1">{item.email} • {item.role}</Text>
                        <Text className="text-[12px] text-[#94a3b8] mt-1.5 uppercase tracking-wide">{item.organization}</Text>
                    </View>
                )}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                ListEmptyComponent={
                    <Text className="text-[#64748b] text-[14px] text-center mt-2">No users found for your organization.</Text>
                }
            />
        </SafeAreaView>
    );
}

/**
 * users-example.tsx
 * 
 * Shows how to consume the useAuth() context, securely verify roles,
 * and dispatch centralized API requests via the userService module.
 */
