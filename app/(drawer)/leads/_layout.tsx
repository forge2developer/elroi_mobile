import { Stack } from 'expo-router';
import React from 'react';

export default function LeadsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="all_leads" options={{ title: 'All Leads' }} />
            <Stack.Screen name="lead_detail" options={{ title: 'Lead Details' }} />
            <Stack.Screen name="add" options={{ title: 'Add Lead' }} />
        </Stack>
    );
}
