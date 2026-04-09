import ScreenWrapper from "@/components/sidebar/ScreenWrapper";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Toast, ToastTitle, useToast, VStack } from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { 
    ChevronLeft, 
    Plus, 
    Target, 
    Info, 
    ChevronRight, 
    ChevronDown 
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    FlatList,
    BackHandler
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { BASE_URL } from "@/src/config/apiConfig";

const { width } = Dimensions.get("window");

function getTheme(isDark: boolean) {
    return {
        bg: isDark ? "#000000" : "#fafafa",
        headerBg: isDark ? "#0a0a0a" : "#ffffff",
        cardBg: isDark ? "#121212" : "#ffffff",
        border: isDark ? "#262626" : "#f0f0f0",
        text: isDark ? "#ffffff" : "#171717",
        textSecondary: isDark ? "#a3a3a3" : "#737373",
        accent: isDark ? "#ffffff" : "#000000",
        accentBg: isDark ? "#262626" : "#f5f5f5",
        green: "#10b981",
        purple: "#8b5cf6",
        blue: "#3b82f6",
        orange: "#f59e0b",
        danger: "#ef4444",
        inputBg: isDark ? "#111111" : "#ffffff",
    };
}

const FIELD_LABELS: Record<string, string> = {
    email: "Email Address",
    location: "Current Location",
    street_address: "Street Address",
    city: "City",
    state: "State",
    province: "Province",
    country: "Country",
    post_code: "Post Code",
    zip_code: "Zip Code",
    dob: "Date of Birth",
    gender: "Gender",
    marital_status: "Marital Status",
    relationship_status: "Relationship Status",
    military_status: "Military Status",
    education_level: "Education Level",
    job_title: "Job Title",
    work_phone: "Work Phone",
    work_email: "Work Email",
    company_name: "Company Name",
    website: "Website",
    sqft: "Area (Sq.ft)",
    bhk: "Type (BHK)",
    bathroom_count: "Bathrooms",
    parking_needed: "Parking",
    furniture: "Furnishing",
    facing: "Facing",
    budget: "Budget",
    price_min: "Minimum Price",
    price_max: "Maximum Price",
    preferred_location: "Preferred Location",
    preferred_floor: "Preferred Floor",
    interested_projects: "Interested Variant",
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
    budget: "e.g. 50L - 1Cr",
    preferred_location: "e.g. Whitefield",
    preferred_floor: "e.g. Higher floor, 5th floor",
    interested_projects: "e.g. 2BHK, 3BHK, Villa",
    sqft: "e.g. 1200 sq.ft",
    bathroom_count: "e.g. 2, 3",
    email: "e.g. lead@example.com",
    location: "e.g. Bangalore",
};

export default function AddLeadScreen() {
    const isDark = useColorScheme() === "dark";
    const theme = getTheme(isDark);
    const router = useRouter();
    const { organization, token, userId, role } = useAuth();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [configs, setConfigs] = useState<any[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showCampaignPicker, setShowCampaignPicker] = useState(false);
    const [showSourcePicker, setShowSourcePicker] = useState(false);
    const [showSubSourcePicker, setShowSubSourcePicker] = useState(false);

    // Form State
    const [formData, setFormData] = useState<any>({
        name: "",
        email: "",
        phone: "",
        location: "",
        campaign: "",
        source: "",
        sub_source: "",
        budget: "",
        preferred_location: "",
        preferred_floor: "",
        interested_projects: "",
        bhk: "",
        furniture: "",
        facing: "",
        sqft: "",
        bathroom_count: "",
        parking_needed: "",
    });

    const [manualRequirements, setManualRequirements] = useState<any[]>([]);
    const [manualContactFields, setManualContactFields] = useState<any[]>([]);

    useEffect(() => {
        fetchConfigs();
        fetchCampaigns();
    }, []);

    // Handle Hardware Back Button
    useEffect(() => {
        const backAction = () => {
            if (selectedConfig) {
                setSelectedConfig(null);
                return true;
            } else {
                if (role === 'admin' || role === 'manager') {
                    router.replace("/(drawer)/Master_dashboard");
                } else {
                    router.replace("/(drawer)/dashboard");
                }
                return true;
            }
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, [selectedConfig, role]);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/campaigns?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            if (result.success) setCampaigns(result.data || []);
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    };

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/api/lead-capture-configs?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            if (result.success) {
                const myConfigs = (result.data || []).filter((config: any) => 
                    config.assigned_people?.some((p: any) => String(p.id) === String(userId)) || 
                    config.assigned_people?.length === 0 ||
                    config.created_by === userId
                );
                setConfigs(myConfigs);
            }
        } catch (error) {
            console.error("Failed to fetch configs:", error);
            Alert.alert("Error", "Failed to load form configurations");
        } finally {
            setLoading(false);
        }
    };

    const handleConfigSelect = (config: any) => {
        setSelectedConfig(config);
        const initialForm = {
            name: "",
            phone: "",
            email: "",
            location: "",
            campaign: config.contact_info?.campaign || "",
            source: config.contact_info?.source || "",
            sub_source: config.contact_info?.sub_source || "",
            furniture: "",
            facing: "",
            sqft: "",
            bathroom_count: "",
            parking_needed: "",
            preferred_location: "",
            preferred_floor: "",
            budget: "",
            interested_projects: "",
            ...(config.contact_info || {}),
        };
        setFormData(initialForm);
        setManualRequirements((config.manual_requirements || []).map((req: any) => ({ ...req, value: "" })));
        setManualContactFields((config.manual_contact_fields || []).map((f: any) => ({ ...f, value: "" })));
    };

    const handleSubmit = async () => {
        // Validation: Name, Phone, Campaign and Source are required
        if (!formData.name || !formData.phone) {
            Alert.alert("Required Fields", "Please provide at least Name and Phone Number.");
            return;
        }
        if (!formData.campaign || !formData.source) {
            Alert.alert("Assignment Required", "Please select a Campaign and Source.");
            return;
        }

        setSubmitting(true);
        try {
            const leadPayload = {
                organization,
                profile: { 
                    ...formData,
                    manual_contact_fields: manualContactFields
                },
                requirement: {
                    ...formData,
                    bhk: [formData.bhk].filter(Boolean),
                    sqft: parseInt(formData.sqft) || undefined,
                    facing: [formData.facing].filter(Boolean),
                    furniture: [formData.furniture].filter(Boolean),
                    // Fix: Map string to boolean for API validation
                    parking_needed: formData.parking_needed === "Required" ? true : formData.parking_needed === "Not Required" ? false : undefined,
                    manual_requirements: manualRequirements,
                    manual_contact_fields: manualContactFields,
                    // Fix: Send interested_projects as the variant text, NOT an object with hex ID if it fails casting
                    interested_projects: formData.interested_projects || ""
                },
                // Use the name as project name
                project: [selectedConfig.project_name || "General"],
                acquired: [{
                    campaign: formData.campaign,
                    source: formData.source,
                    sub_source: formData.sub_source || "Mobile Lead Capture",
                    medium: "Mobile",
                    received: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                }],
                exe_user: userId,
                // Fix: Include the project assigned to this form as a formal Interested Project
                interested_projects: selectedConfig.project_id ? [{
                    project_id: selectedConfig.project_id,
                    project_name: selectedConfig.project_name
                }] : [], 
                status: "Active",
                stage: "New"
            };

            const response = await fetch(`${BASE_URL}/api/leads`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(leadPayload),
            });

            const result = await response.json();
            if (result.success) {
                toast.show({
                    placement: "top",
                    render: ({ id }) => (
                        <Toast nativeID={"toast-" + id} action="success" variant="solid" bg={theme.green} borderRadius="$2xl">
                            <VStack space="xs" className="px-4">
                                <ToastTitle color="#fff" className="text-sm font-black uppercase tracking-widest">Lead captured successfully!</ToastTitle>
                            </VStack>
                        </Toast>
                    ),
                });
                setSelectedConfig(null);
                router.replace("/(drawer)/leads/all_leads");
            } else {
                throw new Error(result.message || "Failed to capture lead");
            }
        } catch (error: any) {
            Alert.alert("Submission Failed", error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bg }}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    if (!selectedConfig) {
        return (
            <ScreenWrapper title="New Lead" showBackButton={false}>
                <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                    <View className="flex-row items-center mb-6">
                        <View className="w-12 h-12 rounded-md items-center justify-center mr-4" style={{ backgroundColor: theme.green + "15" }}>
                            <Target size={24} color={theme.green} />
                        </View>
                        <View>
                            <Text className="text-xl font-black tracking-tight" style={{ color: theme.text }}>Quick Project Forms</Text>
                            <Text className="text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}>Direct entry for your assigned projects</Text>
                        </View>
                    </View>
                    <View className="flex-row flex-wrap justify-between">
                        {configs.map((config) => (
                            <TouchableOpacity
                                key={config._id}
                                onPress={() => handleConfigSelect(config)}
                                className="w-[48%] mb-4 p-5 rounded-lg border shadow-sm"
                                style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                            >
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.green + "15" }}>
                                        <Text className="text-[9px] font-black text-green-500 uppercase">Project</Text>
                                    </View>
                                </View>
                                <Text className="text-lg font-black leading-6 mb-1" style={{ color: theme.text }}>
                                    {config.project_name || config.name?.split(" - ")?.pop() || "Untitled Project"}
                                </Text>
                                <Text className="text-[11px] font-bold opacity-60" style={{ color: theme.textSecondary }}>
                                    {config.name || "Website Lead Form"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {configs.length === 0 && (
                        <View className="items-center justify-center mt-20 p-10">
                            <Info size={48} color={theme.border} className="mb-4" />
                            <Text className="text-center font-bold" style={{ color: theme.textSecondary }}>No lead capture forms assigned to you yet.</Text>
                        </View>
                    )}
                </ScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Project Entry" showBackButton={true} onBack={() => setSelectedConfig(null)}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Section */}
                <View className="p-6 border-b" style={{ borderColor: theme.border }}>
                    <Text className="text-2xl font-black uppercase tracking-tight" style={{ color: theme.text }}>
                        {selectedConfig.name?.toUpperCase() || `LEAD FORM - ${selectedConfig.project_name?.toUpperCase()}`}
                    </Text>
                    <Text className="text-xs font-black uppercase tracking-widest mt-1" style={{ color: theme.green }}>
                        NEW LEAD FOR {selectedConfig.project_name?.toUpperCase() || "PROJECT"}
                    </Text>
                </View>

                {/* Contact Information Section */}
                <View className="px-6 py-8">
                    <View className="flex-row items-center mb-6">
                        <View className="w-2 h-2 rounded-md mr-3" style={{ backgroundColor: theme.blue }} />
                        <Text className="text-[12px] font-black uppercase tracking-[2px]" style={{ color: theme.blue }}>Contact Information</Text>
                    </View>
                    <View className="gap-6">
                        <View>
                            <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>Full Name <Text className="text-red-500">*</Text></Text>
                            <TextInput
                                className="p-4 rounded-lg border text-sm font-semibold"
                                style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                                placeholder="Enter lead full name"
                                placeholderTextColor={theme.textSecondary + "50"}
                                value={formData.name}
                                onChangeText={(val) => setFormData({ ...formData, name: val })}
                            />
                        </View>
                        <View>
                            <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>Phone Number <Text className="text-red-500">*</Text></Text>
                            <TextInput
                                className="p-4 rounded-lg border text-sm font-semibold"
                                style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                                placeholder="Enter phone number"
                                placeholderTextColor={theme.textSecondary + "50"}
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(val) => setFormData({ ...formData, phone: val })}
                            />
                        </View>
                        {selectedConfig.selected_contact_fields?.map((fieldId: string) => {
                            if (fieldId === 'name' || fieldId === 'phone') return null;
                            const label = FIELD_LABELS[fieldId] || fieldId;
                            const placeholder = FIELD_PLACEHOLDERS[fieldId] || `Enter ${label.toLowerCase()}`;
                            return (
                                <View key={fieldId}>
                                    <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>{label}</Text>
                                    <TextInput
                                        className="p-4 rounded-lg border text-sm font-semibold"
                                        style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                                        placeholder={placeholder}
                                        placeholderTextColor={theme.textSecondary + "50"}
                                        value={formData[fieldId]?.toString() || ""}
                                        onChangeText={(val) => setFormData({ ...formData, [fieldId]: val })}
                                    />
                                </View>
                            );
                        })}

                        {/* Manual Contact Fields */}
                        {manualContactFields.map((field, idx) => (
                            <View key={`manual-contact-${idx}`}>
                                <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>{field.key}</Text>
                                <TextInput
                                    className="p-4 rounded-lg border text-sm font-semibold"
                                    style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                                    placeholder={`Enter ${field.key.toLowerCase()}`}
                                    placeholderTextColor={theme.textSecondary + "50"}
                                    value={field.value}
                                    onChangeText={(v) => {
                                        const updated = [...manualContactFields];
                                        updated[idx].value = v;
                                        setManualContactFields(updated);
                                    }}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Requirements Section */}
                {(selectedConfig.selected_fields?.length > 0 || manualRequirements.length > 0) && (
                    <View className="px-6 py-6 border-t" style={{ borderColor: theme.border }}>
                        <View className="flex-row items-center mb-6">
                            <View className="w-2 h-2 rounded-md mr-3" style={{ backgroundColor: theme.purple }} />
                            <Text className="text-[12px] font-black uppercase tracking-[2px]" style={{ color: theme.purple }}>Project Requirements</Text>
                        </View>
                        <View className="gap-6">
                            {selectedConfig.selected_fields?.map((fieldId: string) => {
                                const label = FIELD_LABELS[fieldId] || fieldId;
                                const placeholder = FIELD_PLACEHOLDERS[fieldId] || `Enter ${label.toLowerCase()}`;
                                
                                if (fieldId === 'bhk') {
                                    return (
                                        <View key={fieldId}>
                                            <Text className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: theme.textSecondary }}>{label}</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map(type => (
                                                    <TouchableOpacity key={type} onPress={() => setFormData({ ...formData, bhk: type })}
                                                        className="px-5 py-3 rounded-lg border"
                                                        style={{ backgroundColor: formData.bhk === type ? theme.text : theme.inputBg, borderColor: theme.border }}>
                                                        <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: formData.bhk === type ? theme.bg : theme.text }}>{type}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                }
                                if (fieldId === 'parking_needed') {
                                    return (
                                        <View key={fieldId}>
                                            <Text className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: theme.textSecondary }}>{label}</Text>
                                            <View className="flex-row gap-2">
                                                {['Required', 'Not Required'].map(opt => (
                                                    <TouchableOpacity key={opt} onPress={() => setFormData({ ...formData, parking_needed: opt })}
                                                        className="flex-1 px-5 py-3 rounded-lg border items-center"
                                                        style={{ backgroundColor: formData.parking_needed === opt ? theme.text : theme.inputBg, borderColor: theme.border }}>
                                                        <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: formData.parking_needed === opt ? theme.bg : theme.text }}>{opt}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                }
                                if (fieldId === 'furniture') {
                                    return (
                                        <View key={fieldId}>
                                            <Text className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: theme.textSecondary }}>{label}</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {['Furnished', 'Unfurnished', 'Semi-Furnished'].map(type => (
                                                    <TouchableOpacity key={type} onPress={() => setFormData({ ...formData, furniture: type })}
                                                        className="px-5 py-3 rounded-lg border"
                                                        style={{ backgroundColor: formData.furniture === type ? theme.text : theme.inputBg, borderColor: theme.border }}>
                                                        <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: formData.furniture === type ? theme.bg : theme.text }}>{type}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                }
                                if (fieldId === 'facing') {
                                    return (
                                        <View key={fieldId}>
                                            <Text className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: theme.textSecondary }}>{label}</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {['North', 'South', 'East', 'West'].map(dir => (
                                                    <TouchableOpacity key={dir} onPress={() => setFormData({ ...formData, facing: dir })}
                                                        className="px-5 py-3 rounded-2xl border min-w-[70px] items-center"
                                                        style={{ backgroundColor: formData.facing === dir ? theme.text : theme.inputBg, borderColor: theme.border }}>
                                                        <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: formData.facing === dir ? theme.bg : theme.text }}>{dir}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                }
                                return (
                                    <View key={fieldId}>
                                        <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>{label}</Text>
                                        <TextInput
                                            className="p-4 rounded-lg border text-sm font-semibold"
                                            style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                                            placeholder={placeholder}
                                            placeholderTextColor={theme.textSecondary + "50"}
                                            value={formData[fieldId]?.toString() || ""}
                                            onChangeText={(val) => setFormData({ ...formData, [fieldId]: val })}
                                        />
                                    </View>
                                );
                            })}
                            {manualRequirements.map((req, idx) => (
                                <View key={`manual-${idx}`}>
                                    <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>{req.key}</Text>
                                    <TextInput
                                        className="p-4 rounded-lg border text-sm font-semibold"
                                        style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                                        placeholder={`Enter ${req.key.toLowerCase()}`}
                                        placeholderTextColor={theme.textSecondary + "50"}
                                        value={req.value}
                                        onChangeText={(v) => {
                                            const updated = [...manualRequirements];
                                            updated[idx].value = v;
                                            setManualRequirements(updated);
                                        }}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Acquisition Section */}
                <View className="px-6 py-6 border-t" style={{ borderColor: theme.border }}>
                    <View className="flex-row items-center mb-6">
                        <View className="w-2 h-2 rounded-md mr-3" style={{ backgroundColor: theme.green }} />
                        <Text className="text-[12px] font-black uppercase tracking-[2px]" style={{ color: theme.green }}>Acquisition Source</Text>
                    </View>
                    <View className="gap-6">
                        <View>
                            <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>Campaign Name <Text className="text-red-500">*</Text></Text>
                            <TouchableOpacity onPress={() => setShowCampaignPicker(true)}
                                className="p-4 rounded-lg border flex-row items-center justify-between"
                                style={{ backgroundColor: theme.inputBg, borderColor: theme.border }}>
                                <Text style={{ color: formData.campaign ? theme.text : theme.textSecondary + "80", fontWeight: "600" }}>{formData.campaign || "Select Campaign"}</Text>
                                <ChevronRight size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View>
                            <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>Source <Text className="text-red-500">*</Text></Text>
                            <TouchableOpacity onPress={() => formData.campaign ? setShowSourcePicker(true) : Alert.alert("Required", "Please select a campaign first")}
                                className="p-4 rounded-lg border flex-row items-center justify-between"
                                style={{ backgroundColor: theme.inputBg, borderColor: theme.border, opacity: formData.campaign ? 1 : 0.6 }}>
                                <Text style={{ color: formData.source ? theme.text : theme.textSecondary + "80", fontWeight: "600" }}>{formData.source || "Select Source"}</Text>
                                <ChevronRight size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View>
                            <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>Sub Source</Text>
                            <TouchableOpacity onPress={() => formData.source ? setShowSubSourcePicker(true) : Alert.alert("Required", "Please select a source first")}
                                className="p-4 rounded-lg border flex-row items-center justify-between"
                                style={{ backgroundColor: theme.inputBg, borderColor: theme.border, opacity: formData.source ? 1 : 0.6 }}>
                                <Text style={{ color: formData.sub_source ? theme.text : theme.textSecondary + "80", fontWeight: "600" }}>{formData.sub_source || "Select Sub Source"}</Text>
                                <ChevronRight size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Footer Submit */}
                <View className="p-6">
                    <TouchableOpacity onPress={handleSubmit} disabled={submitting}
                        className="p-4 rounded-lg items-center justify-center flex-row"
                        style={{ backgroundColor: theme.text }}>
                        {submitting ? <ActivityIndicator size="small" color={theme.bg} /> : (
                            <>
                                <Text className="font-bold text-lg mr-2" style={{ color: theme.bg }}>Submit Lead</Text>
                                <ChevronRight size={20} color={theme.bg} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Pickers */}
                <Modal visible={showCampaignPicker} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <View className="p-6 rounded-t-[40px]" style={{ backgroundColor: theme.cardBg, maxHeight: "70%" }}>
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-xl font-black uppercase tracking-tighter" style={{ color: theme.text }}>Select Campaign</Text>
                                <TouchableOpacity onPress={() => setShowCampaignPicker(false)} className="p-2 rounded-lg" style={{ backgroundColor: theme.border }}><ChevronDown size={20} color={theme.text} /></TouchableOpacity>
                            </View>
                            <FlatList data={campaigns} keyExtractor={(item) => item.uuid || item._id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity className="p-5 mb-3 rounded-lg border"
                                        style={{ backgroundColor: formData.campaign === item.campaignName ? theme.text : theme.inputBg, borderColor: theme.border }}
                                        onPress={() => { setFormData({ ...formData, campaign: item.campaignName, source: "", sub_source: "" }); setShowCampaignPicker(false); }}>
                                        <Text className="font-bold" style={{ color: formData.campaign === item.campaignName ? theme.bg : theme.text }}>{item.campaignName}</Text>
                                    </TouchableOpacity>
                                )} />
                        </View>
                    </View>
                </Modal>
                <Modal visible={showSourcePicker} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <View className="p-6 rounded-t-[40px]" style={{ backgroundColor: theme.cardBg, maxHeight: "70%" }}>
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-xl font-black uppercase tracking-tighter" style={{ color: theme.text }}>Select Source</Text>
                                <TouchableOpacity onPress={() => setShowSourcePicker(false)} className="p-2 rounded-lg" style={{ backgroundColor: theme.border }}><ChevronDown size={20} color={theme.text} /></TouchableOpacity>
                            </View>
                            <FlatList data={campaigns.find(c => c.campaignName === formData.campaign)?.sources || []} keyExtractor={(item) => item.uuid}
                                renderItem={({ item }) => (
                                    <TouchableOpacity className="p-5 mb-3 rounded-lg border"
                                        style={{ backgroundColor: formData.source === item.sourceName ? theme.text : theme.inputBg, borderColor: theme.border }}
                                        onPress={() => { setFormData({ ...formData, source: item.sourceName, sub_source: "" }); setShowSourcePicker(false); }}>
                                        <Text className="font-bold" style={{ color: formData.source === item.sourceName ? theme.bg : theme.text }}>{item.sourceName}</Text>
                                    </TouchableOpacity>
                                )} />
                        </View>
                    </View>
                </Modal>
                <Modal visible={showSubSourcePicker} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <View className="p-6 rounded-t-[40px]" style={{ backgroundColor: theme.cardBg, maxHeight: "70%" }}>
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-xl font-black uppercase tracking-tighter" style={{ color: theme.text }}>Select Sub Source</Text>
                                <TouchableOpacity onPress={() => setShowSubSourcePicker(false)} className="p-2 rounded-lg" style={{ backgroundColor: theme.border }}><ChevronDown size={20} color={theme.text} /></TouchableOpacity>
                            </View>
                            <FlatList data={campaigns.find(c => c.campaignName === formData.campaign)?.sources?.find((s: any) => s.sourceName === formData.source)?.subSources || []} keyExtractor={(item) => item.uuid}
                                renderItem={({ item }) => (
                                    <TouchableOpacity className="p-5 mb-3 rounded-lg border"
                                        style={{ backgroundColor: formData.sub_source === item.subSourceName ? theme.text : theme.inputBg, borderColor: theme.border }}
                                        onPress={() => { setFormData({ ...formData, sub_source: item.subSourceName }); setShowSubSourcePicker(false); }}>
                                        <Text className="font-bold" style={{ color: formData.sub_source === item.subSourceName ? theme.bg : theme.text }}>{item.subSourceName}</Text>
                                    </TouchableOpacity>
                                )} />
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </ScreenWrapper>
    );
}
