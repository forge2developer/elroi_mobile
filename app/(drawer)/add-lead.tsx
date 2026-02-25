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
        btnBg: isDark ? '#E5E5E5' : '#000000ff', // Save Lead Button  Background
        btnText: isDark ? '#000000ff' : '#ffffffff', // Save Lead Button Text
        bttnBg: isDark ? '#A94B4D' : '#E7000B', // Cancel Button Background
        bttnText: isDark ? '#f2f2f2ff' : '#ffffffff', // Cancel Button Text
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
        <View className="gap-2">
            <Text className="text-[13px] font-semibold ml-1" style={[{ color: theme.textSecondary }]}>{label}</Text>
            <TextInput
                className="border rounded-xl px-3.5 text-[15px]"
                style={[{
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                    height: multiline ? 100 : 50,
                    textAlignVertical: multiline ? 'top' : 'center',
                    paddingTop: multiline ? 12 : 0,
                }]}
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
        <View className="mb-2 pb-2 border-b" style={[{ borderBottomColor: theme.border }]}>
            <Text className="text-[14px] font-bold uppercase tracking-wide" style={[{ color: color || theme.accent }]}>{title}</Text>
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
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View className="flex-row items-center px-3 py-3.5 border-b gap-3" style={[{ backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5 pl-6">
                    <Menu size={24} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-1.5">
                <Text className="text-[17px] font-bold flex-1 text-center" style={[{ color: theme.text }]}>Add New Lead</Text>
                </Pressable>
                <View className="w-8" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, backgroundColor: theme.bg }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={{ padding: 16, paddingBottom: bottom + 100 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View
                            className="rounded-2xl border p-5 gap-4"
                            style={[{ backgroundColor: theme.cardBg, borderColor: theme.border, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}
                        >

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
            <View
                className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-4 pt-3 border-t"
                style={[{ backgroundColor: theme.headerBg, borderTopColor: theme.border, paddingBottom: bottom + 12 }]}
            >
                <Pressable
                    className="flex-1 h-[52px] rounded-xl border items-center justify-center"
                    style={[{ borderColor: theme.border, backgroundColor: theme.bttnBg }]}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text className="text-[15px] font-semibold" style={[{ color: theme.bttnText }]}>Cancel</Text>
                </Pressable>

                <Pressable
                    className="flex-[2] h-[52px] rounded-xl flex-row items-center justify-center gap-2"
                    style={[{ backgroundColor: theme.btnBg }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Plus size={20} color="#fff" />
                            <Text className="text-[15px] font-semibold" style={[{ color: theme.btnText }]}>Save Lead</Text>
                        </>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}


