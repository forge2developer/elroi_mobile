import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Menu, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Theme ─────────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#0a0a0a' : '#f4f6f9',
        headerBg: isDark ? '#111111' : '#ffffff',
        cardBg: isDark ? '#161616' : '#ffffff',
        border: isDark ? '#222222' : '#e2e8f0',
        text: isDark ? '#e5e5e5' : '#1a1a2e',
        textSecondary: isDark ? '#888888' : '#64748b',
        inputBg: isDark ? '#222222' : '#f8fafc',
        placeholder: isDark ? '#666666' : '#94a3b8',
        accent: isDark ? '#818cf8' : '#1a73e8',
        accentText: '#ffffff',
        danger: '#ef4444',
        sectionHeader: isDark ? '#333' : '#e2e8f0',
        purple: '#a855f7', // Added for Requirements section header match
    };
}

// ─── Components ─────────────────────────────────────────────────────────────────
function FormInput({
    label,
    value,
    onChangeText,
    placeholder,
    theme,
    multiline = false
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    theme: ReturnType<typeof getTheme>;
    multiline?: boolean;
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        borderColor: theme.border,
                        height: multiline ? 100 : 50,
                        textAlignVertical: multiline ? 'top' : 'center',
                        paddingTop: multiline ? 12 : 0,
                    }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.placeholder}
                multiline={multiline}
            />
        </View>
    );
}

function SectionHeader({ title, theme, color }: { title: string; theme: ReturnType<typeof getTheme>; color?: string }) {
    return (
        <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: color || theme.accent }]}>{title}</Text>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function AddLeadScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const navigation = useNavigation();
    const { bottom } = useSafeAreaInsets();
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

    const [loading, setLoading] = useState(false);

    // State matching the requested schema
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
    });

    const [requirements, setRequirements] = useState({
        budget: '',
        prefLocation: '',
        prefFloor: '',
        projects: '',
    });

    const [acquired, setAcquired] = useState({
        campaign: '',
        source: '',
        sub_source: '',
        medium: '',
    });

    const [statusData, setStatusData] = useState({
        stage: '',
        status: '',
    });

    const handleSave = async () => {
        // Validation
        if (!profile.name.trim()) {
            Alert.alert('Validation Error', 'Please enter a name');
            return;
        }
        if (!profile.phone.trim()) {
            Alert.alert('Validation Error', 'Please enter a phone number');
            return;
        }

        setLoading(true);

        try {
            // Get Organization & Token
            let organization = '';
            let token = '';
            try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                token = (await AsyncStorage.getItem('token')) || '';
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    organization = user.organization || user.org || '';
                }
            } catch (e) {
                console.error("Error reading storage", e);
            }

            // Construct Payload
            const payload = {
                organization,
                profile: { ...profile },
                acquired: [{ ...acquired }], // Schema expects an array
                requirements: {
                    budget: requirements.budget,
                    preferred_location: requirements.prefLocation,
                    preferred_floor: requirements.prefFloor,
                    projects: requirements.projects,
                },
                stage: statusData.stage || 'New',
                status: statusData.status || 'New',
            };

            console.log('[AddLead] Payload:', JSON.stringify(payload, null, 2));

            // API Call
            const url = `${API_BASE_URL}/api/leads`;
            console.log('[AddLead] POST', url);

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const rawText = await res.text();
            let data: any = {};
            try {
                data = JSON.parse(rawText);
            } catch {
                if (!res.ok) throw new Error(`Server Error ${res.status}: ${rawText.slice(0, 100)}`);
            }

            if (!res.ok) {
                console.log('[AddLead] Response error data:', data);
                throw new Error(data?.message || data?.error || `Failed to add lead (Status ${res.status})`);
            }

            Alert.alert('Success', 'Lead added successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error: any) {
            console.error('[AddLead] Error:', error);
            Alert.alert('Error', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View style={[styles.topBar, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.topTitle, { color: theme.text }]}>Add New Lead</Text>
                <View style={{ width: 32 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, backgroundColor: theme.bg }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={[styles.content, { paddingBottom: bottom + 100 }]}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>

                            {/* Profile Section */}
                            <SectionHeader title="Profile Information" theme={theme} />
                            <FormInput
                                label="Name *"
                                value={profile.name}
                                onChangeText={(t) => setProfile({ ...profile, name: t })}
                                placeholder="Full Name"
                                theme={theme}
                            />
                            <FormInput
                                label="Email"
                                value={profile.email}
                                onChangeText={(t) => setProfile({ ...profile, email: t })}
                                placeholder="email@example.com"
                                theme={theme}
                            />
                            <FormInput
                                label="Phone"
                                value={profile.phone}
                                onChangeText={(t) => setProfile({ ...profile, phone: t })}
                                placeholder="+1 234 567 890"
                                theme={theme}
                            />
                            <FormInput
                                label="Location"
                                value={profile.location}
                                onChangeText={(t) => setProfile({ ...profile, location: t })}
                                placeholder="City, Country"
                                theme={theme}
                            />

                            {/* Requirements Section */}
                            <View style={{ height: 16 }} />
                            <SectionHeader title="Requirements" theme={theme} color={theme.purple} />
                            <FormInput
                                label="Budget Range"
                                value={requirements.budget}
                                onChangeText={(t) => setRequirements({ ...requirements, budget: t })}
                                placeholder="e.g. 50L - 1Cr"
                                theme={theme}
                            />
                            <FormInput
                                label="Preferred Location"
                                value={requirements.prefLocation}
                                onChangeText={(t) => setRequirements({ ...requirements, prefLocation: t })}
                                placeholder="Enter preferred location"
                                theme={theme}
                            />
                            <FormInput
                                label="Preferred Floor"
                                value={requirements.prefFloor}
                                onChangeText={(t) => setRequirements({ ...requirements, prefFloor: t })}
                                placeholder="e.g. Higher floor"
                                theme={theme}
                            />
                            <FormInput
                                label="Interested Projects / Types"
                                value={requirements.projects}
                                onChangeText={(t) => setRequirements({ ...requirements, projects: t })}
                                placeholder="e.g. 2BHK, Villa"
                                theme={theme}
                            />

                            {/* Acquisition Section */}
                            <View style={{ height: 16 }} />
                            <SectionHeader title="Acquisition Details" theme={theme} />
                            <FormInput
                                label="Source"
                                value={acquired.source}
                                onChangeText={(t) => setAcquired({ ...acquired, source: t })}
                                placeholder="e.g. Website, LinkedIn"
                                theme={theme}
                            />
                            <FormInput
                                label="Sub Source"
                                value={acquired.sub_source}
                                onChangeText={(t) => setAcquired({ ...acquired, sub_source: t })}
                                placeholder="e.g. Landing Page A"
                                theme={theme}
                            />
                            <FormInput
                                label="Campaign"
                                value={acquired.campaign}
                                onChangeText={(t) => setAcquired({ ...acquired, campaign: t })}
                                placeholder="e.g. Summer Sale"
                                theme={theme}
                            />
                            <FormInput
                                label="Medium"
                                value={acquired.medium}
                                onChangeText={(t) => setAcquired({ ...acquired, medium: t })}
                                placeholder="e.g. CPC, Email"
                                theme={theme}
                            />

                            {/* Status Section */}
                            <View style={{ height: 16 }} />
                            <SectionHeader title="Status & Stage" theme={theme} />
                            <FormInput
                                label="Stage"
                                value={statusData.stage}
                                onChangeText={(t) => setStatusData({ ...statusData, stage: t })}
                                placeholder="e.g. New, Qualified"
                                theme={theme}
                            />
                            <FormInput
                                label="Status"
                                value={statusData.status}
                                onChangeText={(t) => setStatusData({ ...statusData, status: t })}
                                placeholder="e.g. Open, Closed"
                                theme={theme}
                            />

                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* Bottom Action Bar */}
            <View style={[styles.footer, { backgroundColor: theme.headerBg, borderTopColor: theme.border, paddingBottom: bottom + 12 }]}>
                <Pressable
                    style={[styles.cancelBtn, { borderColor: theme.border }]}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
                </Pressable>

                <Pressable
                    style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Plus size={20} color="#fff" />
                            <Text style={styles.saveText}>Save Lead</Text>
                        </>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    topBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14,
        borderBottomWidth: 1, gap: 12,
    },
    menuBtn: { padding: 4 },
    topTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
    content: { padding: 16 },
    card: {
        borderRadius: 16, borderWidth: 1, padding: 20, gap: 16,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    sectionHeader: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1 },
    sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
    input: {
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15,
    },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1,
    },
    cancelBtn: {
        flex: 1, height: 52, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    cancelText: { fontSize: 15, fontWeight: '600' },
    saveBtn: {
        flex: 2, height: 52, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    saveText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
