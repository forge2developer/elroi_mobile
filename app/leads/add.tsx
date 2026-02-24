import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
    // Contact
    name: string;
    email: string;
    phone: string;
    location: string;
    // Requirements
    budget: string;
    prefLocation: string;
    prefFloor: string;
    projects: string;
    // Acquisition
    campaign: string;
    source: string;
    subSource: string;
    medium: string;
};

// ─── Theme ─────────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#0a0a0a' : '#f4f6f9',
        headerBg: isDark ? '#111111' : '#ffffff',
        cardBg: isDark ? '#161616' : '#ffffff',
        border: isDark ? '#333333' : '#e2e8f0',
        text: isDark ? '#e5e5e5' : '#1a1a2e',
        textSecondary: isDark ? '#888888' : '#64748b',
        inputBg: isDark ? '#1a1a1a' : '#ffffff',
        accent: isDark ? '#818cf8' : '#1a73e8',
        danger: '#ef4444',
        success: '#22c55e',
        purple: '#a855f7',
    };
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AddLeadScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);
    const navigation = useNavigation();

    const [form, setForm] = useState<FormState>({
        name: '', email: '', phone: '', location: '',
        budget: '', prefLocation: '', prefFloor: '', projects: '',
        campaign: '', source: '', subSource: '', medium: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    const updateForm = (key: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof FormState, string>> = {};
        if (!form.name.trim()) newErrors.name = 'Full name is required';
        if (!form.phone.trim()) newErrors.phone = 'Phone number is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            Alert.alert('Validation Error', 'Please fill in required fields (*).');
            return;
        }

        setLoading(true);
        try {
            // Get Auth Token
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

            // Construct Payload matchining JSON schema
            const payload = {
                organization,
                profile: {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    location: form.location,
                },
                acquired: [{
                    campaign: form.campaign,
                    source: form.source,
                    sub_source: form.subSource,
                    medium: form.medium,
                }],
                // Including requirements as extra metadata if backend supports it or just for record
                requirements: {
                    budget: form.budget,
                    preferred_location: form.prefLocation,
                    preferred_floor: form.prefFloor,
                    projects: form.projects,
                },
                stage: 'New',
                status: 'New',
            };

            const url = `${API_BASE_URL}/api/leads`;
            console.log('[AddLead] POST', url, JSON.stringify(payload));

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = data?.message || data?.error || 'Failed to create lead';
                throw new Error(msg);
            }

            Alert.alert('Success', 'Lead added successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err: any) {
            console.error('[AddLead] Error:', err);
            Alert.alert('Error', err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.headerBg }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </Pressable>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>New Lead</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Enter the details for the new prospective Lead.</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Contact Info */}
                    <SectionHeader title="CONTACT INFORMATION" theme={theme} color={theme.accent} />

                    {/* Row 1 */}
                    <View style={styles.row}>
                        <InputGroup
                            label="Full Name" required={true}
                            value={form.name} onChange={(v: string) => updateForm('name', v)}
                            placeholder="Enter full name" theme={theme} error={errors.name}
                        />
                        {/* Spacer for even layout if single item */}
                        <View style={{ width: 12 }} />
                        <InputGroup
                            label="Email Address"
                            value={form.email} onChange={(v: string) => updateForm('email', v)}
                            placeholder="Enter email address" theme={theme} keyboardType="email-address"
                        />
                    </View>

                    {/* Row 2 */}
                    <View style={styles.row}>
                        <InputGroup
                            label="Phone Number" required={true}
                            value={form.phone} onChange={(v: string) => updateForm('phone', v)}
                            placeholder="Enter phone number" theme={theme} keyboardType="phone-pad" error={errors.phone}
                        />
                        <View style={{ width: 12 }} />
                        <InputGroup
                            label="Current Location"
                            value={form.location} onChange={(v: string) => updateForm('location', v)}
                            placeholder="Enter current location" theme={theme}
                        />
                    </View>

                    {/* Requirements */}
                    <View style={{ height: 20 }} />
                    <SectionHeader title="REQUIREMENTS" theme={theme} color={theme.purple} />

                    <View style={styles.row}>
                        <InputGroup
                            label="Budget Range"
                            value={form.budget} onChange={(v: string) => updateForm('budget', v)}
                            placeholder="e.g. 50L - 1Cr" theme={theme}
                        />
                        <View style={{ width: 12 }} />
                        <InputGroup
                            label="Preferred Location"
                            value={form.prefLocation} onChange={(v: string) => updateForm('prefLocation', v)}
                            placeholder="Enter preferred location" theme={theme}
                        />
                    </View>

                    <View style={styles.row}>
                        <InputGroup
                            label="Preferred Floor"
                            value={form.prefFloor} onChange={(v: string) => updateForm('prefFloor', v)}
                            placeholder="e.g. Higher floor, 5th floor" theme={theme}
                        />
                        <View style={{ width: 12 }} />
                        <InputGroup
                            label="Interested Projects / Types"
                            value={form.projects} onChange={(v: string) => updateForm('projects', v)}
                            placeholder="e.g. 2BHK, 3BHK, Villa" theme={theme}
                        />
                    </View>

                    {/* Acquisition */}
                    <View style={{ height: 20 }} />
                    <SectionHeader title="ACQUISITION SOURCE" theme={theme} color={theme.success} />

                    <View style={styles.row}>
                        <InputGroup
                            label="Campaign Name"
                            value={form.campaign} onChange={(v: string) => updateForm('campaign', v)}
                            placeholder="Enter campaign name" theme={theme}
                        />
                        <View style={{ width: 12 }} />
                        <InputGroup
                            label="Source"
                            value={form.source} onChange={(v: string) => updateForm('source', v)}
                            placeholder="e.g. Facebook, Google" theme={theme}
                        />
                    </View>

                    <View style={styles.row}>
                        <InputGroup
                            label="Sub Source"
                            value={form.subSource} onChange={(v: string) => updateForm('subSource', v)}
                            placeholder="e.g. Lead Form, Messenger" theme={theme}
                        />
                        <View style={{ width: 12 }} />
                        <InputGroup
                            label="Medium"
                            value={form.medium} onChange={(v: string) => updateForm('medium', v)}
                            placeholder="e.g. CPC, Organic" theme={theme}
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                    style={[styles.footerBtn, { backgroundColor: '#ef4444' }]}
                >
                    <Text style={styles.footerBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                    onPress={handleSubmit}
                    disabled={loading}
                    style={[styles.footerBtn, { backgroundColor: '#e2e8f0', flex: 0, minWidth: 120 }]}
                >
                    {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={[styles.footerBtnText, { color: '#000' }]}>Create Lead</Text>}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

// ─── Helper Components ──────────────────────────────────────────────────────────
const SectionHeader = ({ title, theme, color }: { title: string, theme: any, color?: string }) => (
    <View style={styles.sectionHeader}>
        <View style={[styles.bullet, { backgroundColor: color || theme.accent }]} />
        <Text style={[styles.sectionTitle, { color: color || theme.accent }]}>{title}</Text>
    </View>
);

const InputGroup = ({ label, value, onChange, placeholder, theme, required, keyboardType, error }: any) => (
    <View style={styles.inputGroup}>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
            {required && <Text style={{ color: theme.danger, marginLeft: 2 }}>*</Text>}
        </View>
        <TextInput
            style={[
                styles.input,
                {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: error ? theme.danger : theme.border
                }
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary + '80'}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
        />
        {error ? <Text style={{ color: theme.danger, fontSize: 11, marginTop: 2 }}>{error}</Text> : null}
    </View>
);

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    headerSubtitle: { fontSize: 13, marginTop: 2 },

    scrollContent: { padding: 20, paddingBottom: 40 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    bullet: { width: 6, height: 6, borderRadius: 3 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

    row: { flexDirection: 'row', marginBottom: 16 },
    inputGroup: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600' },
    input: {
        borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14,
        height: 46,
    },

    footer: {
        padding: 16, flexDirection: 'row', gap: 12, justifyContent: 'flex-end',
        borderTopWidth: 1,
    },
    footerBtn: {
        paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    },
    footerBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
