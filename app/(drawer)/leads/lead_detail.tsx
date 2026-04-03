import ScreenWrapper from "@/components/sidebar/ScreenWrapper";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Toast, ToastTitle, useToast, VStack } from "@gluestack-ui/themed";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import {
    Bath,
    Building2,
    Calendar,
    Car,
    CheckSquare,
    Clock,
    Compass,
    ExternalLink,
    Eye,
    EyeOff,
    History,
    Home,
    Info,
    LandPlot,
    Layers,
    LayoutGrid,
    Mail,
    MapPin,
    MessageSquare,
    Monitor,
    PhoneCall,
    Plus,
    RefreshCw,
    ServerCrash,
    Sofa,
    Star,
    Trash2,
    User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BASE_URL } from "@/src/config/apiConfig";
const API_BASE_URL = BASE_URL;

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
    purple: isDark ? "#d4d4d4" : "#404040",
    purpleLight: isDark ? "#262626" : "#f5f5f5",
    blue: isDark ? "#d4d4d4" : "#404040",
    green: "#10b981",
    orange: isDark ? "#d4d4d4" : "#404040",
    danger: "#ef4444",
    shadow: isDark ? "transparent" : "rgba(0,0,0,0.03)",
  };
}

const GET_LEAD_BY_ID = `
    query GetLeadById($organization: String!, $id: String!) {
        getLeadById(organization: $organization, id: $id) {
            _id
            profile_id
            organization
            profile { name email phone location }
            stage
            status
            exe_user
            exe_user_name
            project
            createdAt
            site_visits_completed
            propertyRequirement {
                sqft
                bhk
                floor
                balcony
                bathroom_count
                parking_needed
                parking_count
                price_min
                price_max
                furniture
                facing
                plot_type
            }
            interested_projects {
                project_id
                project_name
            }
            acquired {
                campaign
                source
                sub_source
                received
                medium
                created_at
                _id
            }
            important_activities {
                activity_id
                marked_by
            }
             activities {
                id
                user_id
                user_name
                stage
                updates
                reason
                site_visit_date
                site_visit_completed
                site_visit_completed_at
                site_visit_completed_by_name
                status
                notes
                createdAt
            }
        }
    }
`;

const UPDATE_LEAD = `
    mutation UpdateLead($organization: String!, $id: String!, $input: UpdateLeadInput!) {
        updateLead(organization: $organization, id: $id, input: $input) {
            _id
            stage
            status
        }
    }
`;

const CREATE_LEAD_ACTIVITY = `
    mutation CreateLeadActivity($organization: String!, $input: CreateLeadActivityInput!) {
        createLeadActivity(organization: $organization, input: $input) {
            id
        }
    }
`;

const GET_LEAD_STAGES = `
    query GetLeadStages($organization: String!) {
        getLeadStages(organization: $organization) {
            stages {
                id
                name
                color
                nextStages
            }
        }
    }
`;

const UPDATE_PROPERTY_REQUIREMENT = `
    mutation UpdatePropertyRequirement($organization: String!, $leadId: String!, $input: UpdatePropertyRequirementInput!) {
        updatePropertyRequirement(organization: $organization, leadId: $leadId, input: $input) {
            _id
            propertyRequirement {
                sqft bhk floor balcony bathroom_count parking_needed parking_count price_min price_max furniture facing plot_type
            }
        }
    }
`;

const GET_ALL_PROJECTS = `
    query GetAllProjects($organization: String!) {
        getAllProjects(organization: $organization) {
            product_id
            name
        }
    }
`;

const ADD_INTERESTED_PROJECT = `
    mutation AddInterestedProject($organization: String!, $leadId: String!, $projectId: Int!, $projectName: String!) {
        addInterestedProject(organization: $organization, leadId: $leadId, projectId: $projectId, projectName: $projectName) {
            _id
            interested_projects {
                project_id
                project_name
            }
        }
    }
`;

const REMOVE_INTERESTED_PROJECT = `
    mutation RemoveInterestedProject($organization: String!, $leadId: String!, $projectId: Int!) {
        removeInterestedProject(organization: $organization, leadId: $leadId, projectId: $projectId) {
            _id
            interested_projects {
                project_id
                project_name
            }
        }
    }
`;

const TOGGLE_IMPORTANT_ACTIVITY = `
    mutation ToggleImportantActivity($organization: String!, $leadId: String!, $activityId: String!, $userId: String!) {
        toggleImportantActivity(organization: $organization, leadId: $leadId, activityId: $activityId, userId: $userId) {
            _id
            important_activities {
                activity_id
                marked_by
            }
        }
    }
`;

const MARK_SITE_VISIT_COMPLETED = `
    mutation MarkSiteVisitCompleted($organization: String!, $activityId: String!, $userId: String!) {
        markSiteVisitCompleted(organization: $organization, activityId: $activityId, userId: $userId) {
            id
            site_visit_completed
            site_visit_completed_at
            site_visit_completed_by_name
        }
    }
`;

const GET_ORGANIZATION_USERS = `
    query GetOrganizationUsers($organization: String!) {
        getOrganizationUsers(organization: $organization) {
            _id
            profile {
                firstName
                lastName
                email
            }
            role
            isActive
        }
    }
`;

function InfoSection({
  title,
  children,
  theme,
  onEdit,
  className,
}: {
  title: string;
  children: React.ReactNode;
  theme: any;
  onEdit?: () => void;
  className?: string;
}) {
  return (
    <View className={`mb-8 ${className || ""}`}>
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Text
          className="text-[10px] font-black uppercase tracking-[2px]"
          style={{ color: theme.textSecondary }}
        >
          {title}
        </Text>
        {onEdit && (
          <Pressable
            onPress={onEdit}
            className="px-3 py-1.5 rounded-full border"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <Text
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: theme.text }}
            >
              Edit
            </Text>
          </Pressable>
        )}
      </View>
      <View
        className="mx-4 overflow-hidden rounded-[32px] border shadow-sm"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
  theme,
  isLast = false,
  color,
}: {
  label: string;
  value: string;
  icon?: any;
  theme: any;
  isLast?: boolean;
  color?: string;
}) {
  return (
    <View
      className={`flex-row items-center p-5 ${!isLast ? "border-b" : ""}`}
      style={{ borderBottomColor: theme.border }}
    >
      {Icon && (
        <View
          className="p-2.5 rounded-xl mr-4 border"
          style={{
            backgroundColor: color ? color + "15" : theme.bg,
            borderColor: color ? color + "30" : theme.border,
          }}
        >
          <Icon size={16} color={color || theme.text} />
        </View>
      )}
      <View className="justify-center flex-1">
        <Text
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: theme.textSecondary }}
        >
          {label}
        </Text>
        <Text className="text-sm font-semibold" style={{ color: theme.text }}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );
}

function StatItem({ label, value, theme, color }: { label: string; value: number; theme: any; color: string }) {
    return (
        <View
            className="p-4 rounded-[22px] border min-w-[145px] shadow-sm ml-2"
            style={[{ 
                backgroundColor: theme.cardBg, 
                borderColor: theme.border,
                shadowColor: color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
            }]}
        >
            <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-[24px] font-black" style={[{ color }]}>
                    {value}
                </Text>
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            </View>
            <Text className="text-[9px] font-black uppercase tracking-[1px] leading-3" style={[{ color: theme.textSecondary }]}>
                {label}
            </Text>
        </View>
    );
}

function LeadDetailsSkeleton({ theme, isDark, isLandscape }: any) {
  const skeletonColor = isDark ? "#2a2a2a" : "#e5e5e5";
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.headerBg }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        className="flex-row items-center px-4 pt-2 pb-4 border-b"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: theme.border,
          paddingBottom: isLandscape ? 8 : 12,
        }}
      >
        <View
          className="w-10 h-10 mr-4 rounded-full"
          style={{ backgroundColor: skeletonColor }}
        />
        <View
          className="w-32 h-6 rounded"
          style={{ backgroundColor: skeletonColor }}
        />
      </View>
      <View className="flex-1" style={{ backgroundColor: theme.bg }}>
        <View className="flex-row items-center p-4">
          <View
            className="w-16 h-16 mr-4 rounded-2xl"
            style={{ backgroundColor: skeletonColor }}
          />
          <View className="flex-1">
            <View
              className="w-48 h-6 mb-2 rounded"
              style={{ backgroundColor: skeletonColor }}
            />
            <View
              className="w-32 h-4 rounded"
              style={{ backgroundColor: skeletonColor }}
            />
          </View>
        </View>
        <View className="flex-row gap-3 px-4 mb-6">
          <View
            className="flex-1 h-12 rounded-2xl"
            style={{ backgroundColor: skeletonColor }}
          />
          <View
            className="flex-1 h-12 rounded-2xl"
            style={{ backgroundColor: skeletonColor }}
          />
        </View>
        <View className="flex-row gap-3 mx-4 mb-6">
          <View
            className="flex-1 h-24 rounded-2xl"
            style={{ backgroundColor: skeletonColor }}
          />
          <View
            className="flex-1 h-24 rounded-2xl"
            style={{ backgroundColor: skeletonColor }}
          />
        </View>
        <View
          className="h-16 mx-4 mb-3 rounded-xl"
          style={{ backgroundColor: skeletonColor }}
        />
        <View
          className="h-16 mx-4 mb-3 rounded-xl"
          style={{ backgroundColor: skeletonColor }}
        />
      </View>
    </SafeAreaView>
  );
}

export default function LeadDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const isDark = useColorScheme() === "dark";
  const theme = getTheme(isDark);
  const { bottom, top, left, right } = useSafeAreaInsets();
  const { organization: authOrg, token: authToken, userId: authUserId, role: authRole } = useAuth();

  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const tabNames = ["Overview", "Requirements", "Timeline"];

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = tabNames.indexOf(viewableItems[0].item);
      if (index !== -1) {
        setActiveTab(tabNames[index]);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    siteVisits: 0,
    ongoingMissed: 0,
    ongoingAnswered: 0,
    incomingMissed: 0,
    incomingAnswered: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [canEdit, setCanEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [reqForm, setReqForm] = useState<any>({
    sqft: "",
    price_min: "",
    price_max: "",
    bhk: [],
    floor: [],
    balcony: false,
    bathroom_count: "",
    parking_needed: false,
    parking_count: "",
    furniture: [],
    facing: [],
    plot_type: "",
  });
  const [floorInput, setFloorInput] = useState("");
  const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(
    null,
  );

  const currentStage = stages.find(
    (s) => s.name?.toLowerCase() === lead?.stage?.toLowerCase(),
  );
  const stageColor = currentStage?.color || theme.purple;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "hot":
        return "#ef4444";
      case "warm":
        return "#f59e0b";
      case "cold":
        return "#3b82f6";
      default:
        return theme.textSecondary;
    }
  };
  const statusColor = getStatusColor(lead?.status);

  const fetchLeadDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      setLoading(true);
      setError("");

      const organization = authOrg || "";
      const token = authToken || "";
      const userId = authUserId || "";

      if (!organization) {
          throw new Error("No organization found in session context.");
      }

      const response = await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_LEAD_BY_ID,
          variables: { organization, id },
        }),
      });

      const result = await response.json();
      if (result.errors)
        throw new Error(result.errors[0]?.message || "GraphQL Error");
      const leadData = result.data?.getLeadById;
      setLead(leadData);

      if (leadData) {
        const exeUser = leadData.exe_user || "";
        console.log(
          "[LeadDetails] exe_user:",
          exeUser,
          "userId:",
          userId,
          "role:",
          authRole,
        );
        setCanEdit(
          (exeUser !== "" && String(exeUser) === String(userId))
        );
      }

      // Also fetch stages
      const stagesRes = await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_LEAD_STAGES,
          variables: { organization },
        }),
      });
      const stagesResult = await stagesRes.json();
      const stagesData =
        stagesResult.data?.getLeadStages?.stages ||
        stagesResult.data?.getLeadStages ||
        [];
      console.log("[LeadDetails] Stages fetched:", JSON.stringify(stagesData));
      setStages(Array.isArray(stagesData) ? stagesData : []);

      // Also fetch all projects
      const projectsRes = await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: GET_ALL_PROJECTS,
          variables: { organization },
        }),
      });
      const projectsResult = await projectsRes.json();
      setAllProjects(projectsResult.data?.getAllProjects || []);
    } catch (err: any) {
      setError(err.message || "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [id, authOrg, authToken]);

  useEffect(() => {
    fetchLeadDetails();
    fetchStats();
  }, [fetchLeadDetails]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
        const organization = authOrg || '';
        const token = authToken || '';

        if (!organization) return;

        const encodedOrg = encodeURIComponent(organization);
        const headers = { Authorization: `Bearer ${token}` };

        const [adminRes, salesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/dashboard/admin-stats?organization=${encodedOrg}`, { headers }).then(r => r.json()),
            fetch(`${API_BASE_URL}/api/dashboard/sales-summary?organization=${encodedOrg}`, { headers }).then(r => r.json()),
        ]);

        if (adminRes.success || salesRes.success) {
            setStats({
                siteVisits: salesRes.data?.siteVisitDone || 0,
                incomingMissed: adminRes.data?.missedCalls || 0,
                ongoingMissed: 0, 
                ongoingAnswered: 0, 
                incomingAnswered: 0, 
            });
        }
    } catch (error) {
        console.error('[LeadDetail] Stats error:', error);
    } finally {
        setStatsLoading(false);
    }
  };

  const handleCall = () => {
    if (lead?.profile?.phone) Linking.openURL(`tel:${lead.profile.phone}`);
  };
  const handleAddNote = async () => {
    if (!noteText.trim() || !canEdit) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;
      const userId =
        currentUser?.user_id ||
        currentUser?._id ||
        currentUser?.id ||
        currentUser?.user?._id ||
        "";

      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: CREATE_LEAD_ACTIVITY,
          variables: {
            organization,
            input: {
              profile_id: lead.profile_id,
              user_id: userId,
              lead_id: lead._id,
              updates: "notes",
              stage: lead.stage || "",
              status: lead.status || "",
              notes: noteText.trim(),
            },
          },
        }),
      });

      setShowNotesModal(false);
      setNoteText("");
      fetchLeadDetails();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add note");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStage = async (newStage: string) => {
    if (!canEdit) return;

    // Optimistic Update
    const oldLead = { ...lead };
    setLead({ ...lead, stage: newStage });

    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;
      const userId =
        currentUser?.user_id ||
        currentUser?._id ||
        currentUser?.id ||
        currentUser?.user?._id ||
        "";

      // Run mutations in parallel
      await Promise.all([
        fetch(`${API_BASE_URL}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: UPDATE_LEAD,
            variables: {
              organization,
              id: lead._id,
              input: { stage: newStage },
            },
          }),
        }),
        fetch(`${API_BASE_URL}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: CREATE_LEAD_ACTIVITY,
            variables: {
              organization,
              input: {
                profile_id: lead.profile_id,
                user_id: userId,
                lead_id: lead._id,
                updates: "stage",
                stage: newStage,
                status: lead.status || "",
                notes: `Stage updated to ${newStage}`,
              },
            },
          }),
        }),
      ]);

      setShowStageModal(false);

      toast.show({
        placement: "top",
        render: ({ id }) => {
          const toastId = "toast-" + id;
          return (
            <Toast
              nativeID={toastId}
              action="success"
              variant="solid"
              bg={isDark ? "#111" : "#fff"}
              borderWidth={1}
              borderColor={isDark ? "#333" : "#ddd"}
              borderRadius="$xl"
              mt="$10"
            >
              <VStack space="xs">
                <ToastTitle
                  color={isDark ? "#fff" : "#111"}
                >{`Stage updated to ${newStage}`}</ToastTitle>
              </VStack>
            </Toast>
          );
        },
      });

      fetchLeadDetails(); // Silent refresh
    } catch (err) {
      setLead(oldLead); // Rollback
      Alert.alert("Error", "Failed to update stage");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!canEdit) return;

    // Optimistic Update
    const oldLead = { ...lead };
    setLead({ ...lead, status: newStatus });

    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;
      const userId =
        currentUser?.user_id ||
        currentUser?._id ||
        currentUser?.id ||
        currentUser?.user?._id ||
        "";

      await Promise.all([
        fetch(`${API_BASE_URL}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: UPDATE_LEAD,
            variables: {
              organization,
              id: lead._id,
              input: { status: newStatus },
            },
          }),
        }),
        fetch(`${API_BASE_URL}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: CREATE_LEAD_ACTIVITY,
            variables: {
              organization,
              input: {
                profile_id: lead.profile_id,
                user_id: userId,
                lead_id: lead._id,
                updates: "status",
                stage: lead.stage || "",
                status: newStatus,
                notes: `Status updated to ${newStatus}`,
              },
            },
          }),
        }),
      ]);

      setShowStatusModal(false);

      toast.show({
        placement: "top",
        render: ({ id }) => {
          const toastId = "toast-" + id;
          return (
            <Toast
              nativeID={toastId}
              action="success"
              variant="solid"
              bg={isDark ? "#111" : "#fff"}
              borderWidth={1}
              borderColor={isDark ? "#333" : "#ddd"}
              borderRadius="$xl"
              mt="$10"
            >
              <VStack space="xs">
                <ToastTitle
                  color={isDark ? "#fff" : "#111"}
                >{`Status updated to ${newStatus}`}</ToastTitle>
              </VStack>
            </Toast>
          );
        },
      });

      fetchLeadDetails(); // Silent refresh
    } catch (err) {
      setLead(oldLead); // Rollback
      Alert.alert("Error", "Failed to update status");
    }
  };

  const filteredActivities =
    lead?.activities?.filter((a: any) => {
      if (timelineFilter === "all") return true;
      if (timelineFilter === "important") {
        return lead?.important_activities?.some(
          (ia: any) => String(ia.activity_id) === String(a.id),
        );
      }
      return a.updates === timelineFilter;
    }) || [];

  const handleToggleImportant = async (activityId: string) => {
    if (!canEdit) return;
    setUpdatingActivityId(activityId);
    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;
      const userId =
        currentUser?.user_id ||
        currentUser?._id ||
        currentUser?.id ||
        currentUser?.user?._id ||
        "";

      const isAlreadyImportant = lead?.important_activities?.some(
        (ia: any) => String(ia.activity_id) === String(activityId),
      );

      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: TOGGLE_IMPORTANT_ACTIVITY,
          variables: { organization, leadId: lead._id, activityId, userId },
        }),
      });
      await fetchLeadDetails();
      toast.show({
        placement: "top",
        render: ({ id }) => {
          const toastId = "toast-" + id;
          return (
            <Toast
              nativeID={toastId}
              action="success"
              variant="solid"
              bg={isDark ? "#111" : "#fff"}
              borderWidth={1}
              borderColor={isDark ? "#333" : "#ddd"}
              borderRadius="$xl"
              mt="$10"
            >
              <VStack space="xs">
                <ToastTitle color={isDark ? "#fff" : "#111"}>
                  {isAlreadyImportant
                    ? "Removed from important"
                    : "Marked as important"}
                </ToastTitle>
              </VStack>
            </Toast>
          );
        },
      });
    } catch (err) {
      Alert.alert("Error", "Failed to update important status");
    } finally {
      setUpdatingActivityId(null);
    }
  };

  const handleMarkSiteVisitCompleted = async (activityId: string) => {
    if (!canEdit) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;
      const userId =
        currentUser?.user_id ||
        currentUser?._id ||
        currentUser?.id ||
        currentUser?.user?._id ||
        "";
      const userName = currentUser?.name || "User";

      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: MARK_SITE_VISIT_COMPLETED,
          variables: { organization, activityId, userId },
        }),
      });
      fetchLeadDetails();
    } catch (err) {
      Alert.alert("Error", "Failed to mark site visit as completed");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateRequirements = async () => {
    if (!canEdit) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;

      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: UPDATE_PROPERTY_REQUIREMENT,
          variables: {
            organization,
            leadId: lead._id,
            input: {
              sqft: parseInt(reqForm.sqft) || undefined,
              price_min: parseInt(reqForm.price_min) || undefined,
              price_max: parseInt(reqForm.price_max) || undefined,
              bhk: reqForm.bhk,
              floor: reqForm.floor || [],
              balcony: reqForm.balcony || false,
              bathroom_count: parseInt(reqForm.bathroom_count) || undefined,
              parking_needed: reqForm.parking_needed || false,
              parking_count: parseInt(reqForm.parking_count) || undefined,
              furniture: reqForm.furniture || [],
              facing: reqForm.facing || [],
              plot_type: reqForm.plot_type || "",
            },
          },
        }),
      });

      // 2. Create Activity
      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: CREATE_LEAD_ACTIVITY,
          variables: {
            organization,
            input: {
              lead_id: lead._id,
              updates: "requirement",
              notes: `Updated property requirements: ${reqForm.sqft} sqft, ${reqForm.bhk.join(", ")}`,
            },
          },
        }),
      });

      setShowReqModal(false);
      fetchLeadDetails();
    } catch (err) {
      Alert.alert("Error", "Failed to update requirements");
    } finally {
      setUpdating(false);
    }
  };
  const handleAddProject = async (projectId: number, projectName: string) => {
    if (!canEdit) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;

      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: ADD_INTERESTED_PROJECT,
          variables: {
            organization,
            leadId: lead._id,
            projectId,
            projectName,
          },
        }),
      });

      // 2. Create Activity
      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: CREATE_LEAD_ACTIVITY,
          variables: {
            organization,
            input: {
              lead_id: lead._id,
              updates: "requirement",
              notes: `Added interested project: ${projectName}`,
            },
          },
        }),
      });

      fetchLeadDetails();
    } catch (err) {
      Alert.alert("Error", "Failed to add project");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveProject = async (projectId: number) => {
    if (!canEdit) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const organization = lead.organization;

      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: REMOVE_INTERESTED_PROJECT,
          variables: {
            organization,
            leadId: lead._id,
            projectId,
          },
        }),
      });

      // 2. Create Activity
      await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: CREATE_LEAD_ACTIVITY,
          variables: {
            organization,
            input: {
              lead_id: lead._id,
              updates: "requirement",
              notes: `Removed interested project`,
            },
          },
        }),
      });

      fetchLeadDetails();
    } catch (err) {
      Alert.alert("Error", "Failed to remove project");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !lead) {
    return (
      <LeadDetailsSkeleton
        theme={theme}
        isDark={isDark}
        isLandscape={isLandscape}
      />
    );
  }

  // Helper function to handle tab switching on button press
  const handleTabPress = (index: number) => {
    setActiveTab(tabNames[index]);
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  // Animated scroll event listener
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onMomentumScrollEnd = (event: any) => {
    const pageSize = event.nativeEvent.layoutMeasurement.width;
    const currentPage = Math.round(
      event.nativeEvent.contentOffset.x / pageSize,
    );
    if (currentPage >= 0 && currentPage < tabNames.length) {
      setActiveTab(tabNames[currentPage]);
    }
  };

  if (error) {
    return (
      <View
        className="items-center justify-center flex-1 p-8"
        style={{ backgroundColor: theme.bg }}
      >
        <ServerCrash size={56} color={theme.danger} />
        <Text className="mt-4 text-xl font-bold" style={{ color: theme.text }}>
          Oops!
        </Text>
        <Text
          className="mt-2 text-center"
          style={{ color: theme.textSecondary }}
        >
          {error}
        </Text>
        <Pressable
          onPress={fetchLeadDetails}
          className="px-8 py-3 mt-8 rounded-full"
          style={{ backgroundColor: theme.accent }}
        >
          <Text
            className="font-bold text-white"
            style={{ color: isDark ? "#000" : "#fff" }}
          >
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenWrapper
      title="Lead Details"
      headerRight={
        !updating ? (
          <Pressable
            onPress={fetchLeadDetails}
            className="p-2 -mr-2 rounded-full"
            style={{ backgroundColor: theme.accentBg }}
          >
            <RefreshCw size={isLandscape ? 16 : 18} color={theme.text} />
          </Pressable>
        ) : (
          <ActivityIndicator size="small" color={theme.accent} />
        )
      }
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* View Only Banner - Moved below header */}
      {!canEdit && lead && (
        <View
          style={{
            backgroundColor: isDark
              ? "rgba(146, 64, 14, 0.3)"
              : "rgba(254, 243, 199, 0.8)",
            borderBottomWidth: 1,
            borderBottomColor: isDark
              ? "rgba(146, 64, 14, 0.5)"
              : "rgba(252, 211, 77, 1)",
            paddingVertical: isLandscape ? 6 : 10,
          }}
          className="flex-row items-center justify-center px-4"
        >
          <Info size={14} color="#92400e" className="mr-2" />
          <Text className="text-xs font-semibold text-center text-amber-800 dark:text-amber-400">
            View only — This lead is assigned to{" "}
            {lead?.exe_user_name || "their executive"}
          </Text>
        </View>
      )}
        {/* Quick Profile Header */}
        <View className="flex-row items-center p-4">
          <View
            className="items-center justify-center w-16 h-16 mr-4 border rounded-2xl"
            style={{
              backgroundColor: stageColor + "15",
              borderColor: stageColor + "30",
            }}
          >
            <Text className="text-2xl font-bold" style={{ color: stageColor }}>
              {lead?.profile?.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold" style={{ color: theme.text }}>
                {canEdit ? lead?.profile?.name : "Protected Lead"}
              </Text>
              <View
                className="px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: theme.accentBg }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  #{lead?.profile_id}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2 mt-1">
              {lead?.exe_user_name && (
                <View className="flex-row items-center">
                  <User
                    size={12}
                    color={theme.textSecondary}
                    className="mr-1"
                  />
                  <Text
                    className="text-xs"
                    style={{ color: theme.textSecondary }}
                  >
                    Assigned: {lead.exe_user_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions bar */}
        <View className="flex-row gap-3 px-4 mb-4 mt-2">
          <Pressable
            onPress={handleCall}
            className="flex-1 flex-row items-center justify-center p-3.5 rounded-2xl"
            style={{
              backgroundColor: theme.headerBg,
              borderWidth: 1.5,
              borderColor: stageColor,
            }}
          >
            <PhoneCall size={18} color={stageColor} className="mr-2" />
            <Text
              className="text-[15px] font-bold"
              style={{ color: stageColor }}
            >
              Call
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (canEdit) setShowNotesModal(true);
            }}
            disabled={!canEdit}
            className="flex-1 flex-row items-center justify-center p-3.5 rounded-2xl"
            style={{
              backgroundColor: isDark ? "#171717" : "#0f172a",
              opacity: canEdit ? 1 : 0.5,
            }}
          >
            <Plus size={18} color="#ffffff" className="mr-1.5" />
            <Text className="text-[15px] font-bold text-white">
              Add Note
            </Text>
          </Pressable>
        </View>

        {/* ─── Stats Section ─────────────────────────────────────────────── */}
        <View className="mb-4 mt-2">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
                <StatItem label="Site Visits Completed" value={lead?.site_visits_completed || 0} theme={theme} color="#10b981" />
                <StatItem label="Ongoing Missed Calls" value={stats.ongoingMissed} theme={theme} color="#ef4444" />
                <StatItem label="Ongoing Answered Calls" value={stats.ongoingAnswered} theme={theme} color="#3b82f6" />
                <StatItem label="Incoming Missed Calls" value={stats.incomingMissed} theme={theme} color="#f59e0b" />
                <StatItem label="Incoming Answered Calls" value={stats.incomingAnswered} theme={theme} color="#8b5cf6" />
            </ScrollView>
        </View>

      {/* Swipeable Cards Section */}
      <View className="flex-1">
        {/* Swipeable Tabs Navigation */}
        <View
          className="flex-row justify-between mb-4 mx-4 mt-2 p-1 rounded-2xl border"
          style={{ backgroundColor: isDark ? "#111111" : "#f1f5f9", borderColor: theme.border }}
        >
          {tabNames.map((tab, index) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => handleTabPress(index)}
                className="py-2.5 px-3 flex-1 items-center justify-center rounded-xl"
                style={[{
                  backgroundColor: isActive ? (isDark ? "#262626" : "#ffffff") : "transparent",
                }, isActive && {
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    },
                    android: {
                      elevation: 2,
                    },
                  })
                }]}
              >
                <Text
                  className="text-[13px] tracking-tight"
                  style={{
                    color: isActive ? theme.text : theme.textSecondary,
                    fontWeight: isActive ? "700" : "500",
                  }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Swipeable Cards Container */}
        <FlatList
          ref={flatListRef}
          data={tabNames}
          horizontal
          pagingEnabled
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          keyExtractor={(item) => item}
          renderItem={({ item: tab }) => (
            <ScrollView
              key={tab}
              className="flex-1"
              style={{ width }}
              contentContainerStyle={{
                paddingTop: 2,
              }}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!Platform.select({ web: true })}
            >
              {tab === "Overview" && (
                <>
                  <View className="flex-row gap-3 mx-4 mt-4 mb-6">
                    <Pressable
                      disabled={!canEdit}
                      onPress={() => setShowStageModal(true)}
                      className="flex-1 p-4 rounded-[28px] border"
                      style={{
                        backgroundColor: stageColor + "10",
                        borderColor: stageColor + "20",
                      }}
                    >
                      <Text
                        className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: theme.textSecondary }}
                      >
                        Stage
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className="h-1.5 w-1.5 rounded-full mr-2"
                          style={{ backgroundColor: stageColor }}
                        />
                        <Text
                          className="text-[15px] font-black"
                          style={{ color: theme.text }}
                        >
                          {lead?.stage || "New"}
                        </Text>
                      </View>
                      {canEdit && (
                        <Text
                          className="text-[9px] font-bold mt-1.5"
                          style={{ color: theme.textSecondary }}
                        >
                          Change Stage →
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      disabled={!canEdit}
                      onPress={() => setShowStatusModal(true)}
                      className="flex-1 p-4 rounded-[28px] border"
                      style={{
                        backgroundColor: statusColor + "10",
                        borderColor: statusColor + "20",
                      }}
                    >
                      <Text
                        className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: theme.textSecondary }}
                      >
                        Status
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className="h-1.5 w-1.5 rounded-full mr-2"
                          style={{ backgroundColor: statusColor }}
                        />
                        <Text
                          className="text-[15px] font-black"
                          style={{ color: theme.text }}
                        >
                          {lead?.status || "Cold"}
                        </Text>
                      </View>
                      {canEdit && (
                        <Text
                          className="text-[9px] font-bold mt-1.5"
                          style={{ color: theme.textSecondary }}
                        >
                          Change Status →
                        </Text>
                      )}
                    </Pressable>
                  </View>

                  <InfoSection title="Contact Information" theme={theme}>
                    <DetailRow
                      label="Phone"
                      value={
                        canEdit
                          ? showContact
                            ? lead?.profile?.phone
                            : "Tap below to reveal"
                          : "Hidden for privacy"
                      }
                      icon={PhoneCall}
                      theme={theme}
                      color={stageColor}
                    />
                    <DetailRow
                      label="Email"
                      value={
                        canEdit
                          ? showContact
                            ? lead?.profile?.email
                            : "Tap below to reveal"
                          : "Hidden for privacy"
                      }
                      icon={Mail}
                      theme={theme}
                      color={stageColor}
                    />
                    <DetailRow
                      label="Location"
                      value={lead?.profile?.location}
                      icon={MapPin}
                      theme={theme}
                      color={stageColor}
                      isLast={!canEdit}
                    />
                    {canEdit && (
                      <Pressable
                        onPress={() => setShowContact(!showContact)}
                        className="flex-row items-center justify-center p-4 border-t"
                        style={{ borderTopColor: theme.border }}
                      >
                        {showContact ? (
                          <EyeOff
                            size={16}
                            color={theme.textSecondary}
                            className="mr-2"
                          />
                        ) : (
                          <Eye
                            size={16}
                            color={theme.textSecondary}
                            className="mr-2"
                          />
                        )}
                        <Text
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: theme.textSecondary }}
                        >
                          {showContact ? "Hide Details" : "Show Details"}
                        </Text>
                      </Pressable>
                    )}
                  </InfoSection>

                  {/* Campaign Response Card */}
                  <InfoSection title="Campaign Response" theme={theme}>
                    {(() => {
                      const acquiredArr = Array.isArray(lead?.acquired)
                        ? lead.acquired
                        : lead?.acquired
                          ? [lead.acquired]
                          : [];
                      if (acquiredArr.length === 0) {
                        return (
                          <View className="items-center p-10">
                            <Info
                              size={32}
                              color={theme.border}
                              className="mb-2"
                            />
                            <Text
                              className="text-xs"
                              style={{ color: theme.textSecondary }}
                            >
                              No acquisition data available
                            </Text>
                          </View>
                        );
                      }
                      return acquiredArr.map((item: any, index: number) => (
                        <View key={item._id || index} className="p-5">
                          {/* Date/Time Header */}
                          <View className="flex-row items-center mb-4">
                            <View
                              className="p-1.5 rounded-lg mr-2.5"
                              style={{ backgroundColor: stageColor + "15" }}
                            >
                              <Clock size={12} color={stageColor} />
                            </View>
                            <Text
                              className="text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: theme.textSecondary }}
                            >
                              {item.received
                                ? new Date(item.received).toLocaleDateString(
                                    undefined,
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "N/A"}
                              {"  •  "}
                              {item.received
                                ? new Date(item.received).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : ""}
                            </Text>
                          </View>

                          {/* Main Campaign/Project Info */}
                          <View className="flex-row items-start justify-between mb-6">
                            <View className="flex-1 mr-4">
                              <Text
                                className="text-[11px] font-bold uppercase tracking-widest mb-1.5"
                                style={{ color: theme.accent }}
                              >
                                Campaign Name
                              </Text>
                              <Text
                                className="text-xl font-bold leading-7 capitalize"
                                style={{ color: theme.text }}
                              >
                                {item.campaign || "N/A"}
                              </Text>
                            </View>
                            <View className="items-end">
                              <Text
                                className="text-[11px] font-bold uppercase tracking-widest mb-1.5"
                                style={{ color: theme.textSecondary }}
                              >
                                Project
                              </Text>
                              <View
                                className="px-3 py-1.5 rounded-xl border"
                                style={{
                                  borderColor: theme.border,
                                  backgroundColor: theme.accentBg,
                                }}
                              >
                                <Text
                                  className="text-[11px] font-bold"
                                  style={{ color: theme.text }}
                                >
                                  {(Array.isArray(lead?.project)
                                    ? lead.project[0]
                                    : lead?.project) || "N/A"}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Details Grid */}
                          <View className="flex-row" style={{ gap: 10 }}>
                            {[
                              {
                                label: "Source",
                                value: item.source,
                                icon: LayoutGrid,
                                color: stageColor,
                              },
                              {
                                label: "Sub Source",
                                value: item.sub_source,
                                icon: Layers,
                                color: stageColor,
                              },
                              {
                                label: "Medium",
                                value: item.medium,
                                icon: Monitor,
                                color: stageColor,
                              },
                            ].map((cell, i) => (
                              <View
                                key={i}
                                className="flex-1 p-4 rounded-[28px] border"
                                style={{
                                  backgroundColor: theme.bg,
                                  borderColor: theme.border,
                                }}
                              >
                                <View className="flex-row items-center mb-2.5">
                                  <cell.icon
                                    size={12}
                                    color={cell.color}
                                    className="mr-2"
                                  />
                                  <Text
                                    className="text-[9px] font-bold uppercase tracking-widest"
                                    style={{ color: theme.textSecondary }}
                                  >
                                    {cell.label}
                                  </Text>
                                </View>
                                <Text
                                  className="text-sm font-bold capitalize"
                                  style={{ color: theme.text }}
                                  numberOfLines={1}
                                >
                                  {cell.value || "N/A"}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {index < acquiredArr.length - 1 && (
                            <View
                              className="h-px mt-8 bg-white/5"
                              style={{
                                marginHorizontal: -20,
                                backgroundColor: theme.border,
                              }}
                            />
                          )}
                        </View>
                      ));
                    })()}
                  </InfoSection>

                  {/* Executive Details Card */}
                  <InfoSection title="Executive Details" theme={theme}>
                    {(() => {
                      const exeName = lead?.exe_user_name || "Unassigned";
                      const initials =
                        exeName !== "Unassigned"
                          ? exeName
                              .trim()
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w: string) => w[0])
                              .join("")
                              .toUpperCase()
                          : "UN";

                      // Calculate engagement stats from activities
                      const exeStats = {
                        whatsapp: 0,
                        mail: 0,
                        call: 0,
                        sms: 0,
                      };
                      if (lead?.activities && lead?.exe_user) {
                        lead.activities.forEach((a: any) => {
                          if (a.user_id === lead.exe_user) {
                            const up = a.updates?.toLowerCase();
                            if (up === "whatsapp") exeStats.whatsapp++;
                            if (up === "mail") exeStats.mail++;
                            if (up === "phonecall" || up === "call")
                              exeStats.call++;
                            if (up === "sms") exeStats.sms++;
                          }
                        });
                      }

                      const engagementRows = [
                        {
                          icon: MessageSquare,
                          label: "Whatsapp Engaged",
                          count: exeStats.whatsapp,
                          color: stageColor,
                        },
                        {
                          icon: Mail,
                          label: "Mail Engaged",
                          count: exeStats.mail,
                          color: stageColor,
                        },
                        {
                          icon: PhoneCall,
                          label: "Phone Call Engaged",
                          count: exeStats.call,
                          color: stageColor,
                        },
                        {
                          icon: MessageSquare,
                          label: "SMS Engaged",
                          count: exeStats.sms,
                          color: stageColor,
                        },
                      ];

                      return (
                        <View className="p-5">
                          {/* Executive Name Header */}
                          <View className="flex-row items-center mb-6">
                            <View
                              className="items-center justify-center mr-4 border h-14 w-14 rounded-2xl"
                              style={{
                                borderColor: stageColor + "30",
                                backgroundColor: stageColor + "15",
                              }}
                            >
                              <User size={24} color={stageColor} />
                            </View>
                            <View className="flex-1">
                              <Text
                                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                                style={{ color: theme.textSecondary }}
                              >
                                Assigned Executive
                              </Text>
                              <Text
                                className="text-lg font-bold"
                                style={{ color: theme.text }}
                              >
                                {exeName}
                              </Text>
                              <View className="flex-row items-center mt-1">
                                <View className="w-2 h-2 mr-2 bg-green-500 rounded-full" />
                                <Text
                                  className="text-[10px] font-bold uppercase tracking-wider"
                                  style={{ color: theme.textSecondary }}
                                >
                                  Team Pre-Sales
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              className="p-2 border rounded-full"
                              style={{
                                borderColor: theme.border,
                                backgroundColor: theme.accentBg,
                              }}
                            >
                              <ExternalLink
                                size={16}
                                color={theme.textSecondary}
                              />
                            </TouchableOpacity>
                          </View>

                          {/* Engagement Stats Grid */}
                          <View
                            className="flex-row flex-wrap"
                            style={{ gap: 10 }}
                          >
                            {engagementRows.map((row) => (
                              <View
                                key={row.label}
                                className="flex-1 min-w-[150px] p-5 rounded-[28px] border"
                                style={{
                                  backgroundColor: theme.bg,
                                  borderColor: theme.border,
                                }}
                              >
                                <View className="flex-row items-center justify-between mb-4">
                                  <View
                                    className="p-2.5 rounded-xl"
                                    style={{
                                      backgroundColor: row.color + "15",
                                    }}
                                  >
                                    <row.icon size={15} color={row.color} />
                                  </View>
                                  <Text
                                    className="text-xl font-black"
                                    style={{ color: theme.text }}
                                  >
                                    {row.count}
                                  </Text>
                                </View>
                                <Text
                                  className="text-[10px] font-bold uppercase tracking-widest"
                                  style={{ color: theme.textSecondary }}
                                >
                                  {row.label.replace(" Engaged", "")}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}
                  </InfoSection>
                </>
              )}

              {tab === "Requirements" && (
                <>
                  <InfoSection
                    className="mt-4"
                    title="Property Preferences"
                    theme={theme}
                    onEdit={
                      canEdit
                        ? () => {
                            setReqForm({
                              sqft:
                                lead?.propertyRequirement?.sqft?.toString() ||
                                "",
                              price_min:
                                lead?.propertyRequirement?.price_min?.toString() ||
                                "",
                              price_max:
                                lead?.propertyRequirement?.price_max?.toString() ||
                                "",
                              bhk: lead?.propertyRequirement?.bhk || [],
                              floor: lead?.propertyRequirement?.floor || [],
                              balcony:
                                lead?.propertyRequirement?.balcony || false,
                              bathroom_count:
                                lead?.propertyRequirement?.bathroom_count?.toString() ||
                                "",
                              parking_needed:
                                lead?.propertyRequirement?.parking_needed ||
                                false,
                              parking_count:
                                lead?.propertyRequirement?.parking_count?.toString() ||
                                "",
                              furniture:
                                lead?.propertyRequirement?.furniture || [],
                              facing: lead?.propertyRequirement?.facing || [],
                              plot_type:
                                lead?.propertyRequirement?.plot_type || "",
                            });
                            setFloorInput("");
                            setShowReqModal(true);
                          }
                        : undefined
                    }
                  >
                    {(() => {
                      const pr = lead?.propertyRequirement;
                      const rows: {
                        label: string;
                        value: string;
                        icon: any;
                        color: string;
                      }[] = [];

                      if (pr?.sqft)
                        rows.push({
                          label: "Area (Sqft)",
                          value: `${pr.sqft} sqft`,
                          icon: Home,
                          color: stageColor,
                        });
                      if (pr?.bhk?.length)
                        rows.push({
                          label: "Type (BHK)",
                          value: pr.bhk.join(", "),
                          icon: LayoutGrid,
                          color: stageColor,
                        });
                      if (pr?.floor?.length)
                        rows.push({
                          label: "Floor",
                          value: pr.floor
                            .map((f: string) => `Floor ${f}`)
                            .join(", "),
                          icon: Layers,
                          color: stageColor,
                        });
                      if (pr?.balcony)
                        rows.push({
                          label: "Balcony",
                          value: "Required",
                          icon: Home,
                          color: stageColor,
                        });
                      if (pr?.bathroom_count)
                        rows.push({
                          label: "Bathrooms",
                          value: `${pr.bathroom_count}`,
                          icon: Bath,
                          color: stageColor,
                        });
                      if (pr?.parking_needed)
                        rows.push({
                          label: "Parking",
                          value: pr.parking_count
                            ? `${pr.parking_count} spots`
                            : "Yes",
                          icon: Car,
                          color: stageColor,
                        });
                      if (pr?.price_min || pr?.price_max)
                        rows.push({
                          label: "Price Range (₹)",
                          value: `₹${pr.price_min || "—"} — ₹${pr.price_max || "—"}`,
                          icon: Info,
                          color: stageColor,
                        });
                      if (pr?.furniture?.length)
                        rows.push({
                          label: "Furniture",
                          value: pr.furniture.join(", "),
                          icon: Sofa,
                          color: stageColor,
                        });
                      if (pr?.facing?.length)
                        rows.push({
                          label: "Facing",
                          value: pr.facing.join(", "),
                          icon: Compass,
                          color: stageColor,
                        });
                      if (pr?.plot_type)
                        rows.push({
                          label: "Plot Type",
                          value: pr.plot_type,
                          icon: LandPlot,
                          color: stageColor,
                        });

                      if (rows.length === 0) {
                        return (
                          <View className="items-center p-5">
                            <Text
                              className="text-xs"
                              style={{ color: theme.textSecondary }}
                            >
                              No property preferences set yet
                            </Text>
                          </View>
                        );
                      }

                      return rows.map((row, idx) => (
                        <DetailRow
                          key={row.label}
                          label={row.label}
                          value={row.value}
                          icon={row.icon}
                          theme={theme}
                          color={row.color}
                          isLast={idx === rows.length - 1}
                        />
                      ));
                    })()}
                  </InfoSection>

                  <InfoSection
                    title="Interested Projects"
                    theme={theme}
                    onEdit={
                      canEdit ? () => setShowProjectsModal(true) : undefined
                    }
                  >
                    {lead?.interested_projects?.length > 0 ? (
                      lead.interested_projects.map((p: any, idx: number) => (
                        <View
                          key={p.project_id}
                          className={`flex-row items-center justify-between pr-4 ${idx !== lead.interested_projects.length - 1 ? "border-b" : ""}`}
                          style={
                            idx !== lead.interested_projects.length - 1
                              ? { borderBottomColor: theme.border }
                              : {}
                          }
                        >
                          <View className="flex-1">
                            <DetailRow
                              label="Project"
                              value={p.project_name}
                              icon={Building2}
                              theme={theme}
                              color={stageColor}
                              isLast={true}
                            />
                          </View>
                          {canEdit && (
                            <TouchableOpacity
                              onPress={() => handleRemoveProject(p.project_id)}
                            >
                              <Trash2 size={16} color={theme.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    ) : (
                      <View className="items-center p-4">
                        <Text
                          className="text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          No projects interested yet
                        </Text>
                      </View>
                    )}
                  </InfoSection>
                </>
              )}

              {tab === "Timeline" && (
                <View className="px-4">
                  {/* Timeline Header with Filter Label */}
                  <View className="flex-row items-center justify-between mt-4 mb-4">
                    <Text
                      className="text-sm font-bold"
                      style={{ color: theme.textSecondary }}
                    >
                      Activities
                    </Text>
                  </View>

                  {/* Quick Filters (Horizontal Scroll) */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="px-4 mb-6 -mx-4"
                  >
                    {[
                      "all",
                      "notes",
                      "phonecall",
                      "whatsapp",
                      "sms",
                      "mail",
                      "site_visit",
                      "follow_up",
                      "important",
                    ].map((filter) => (
                      <Pressable
                        key={filter}
                        onPress={() => setTimelineFilter(filter)}
                        className="px-4 py-2 mr-2 border rounded-full"
                        style={{
                          backgroundColor:
                            timelineFilter === filter
                              ? theme.accent
                              : theme.cardBg,
                          borderColor:
                            timelineFilter === filter
                              ? theme.accent
                              : theme.border,
                        }}
                      >
                        <Text
                          className="text-xs font-bold capitalize"
                          style={{
                            color:
                              timelineFilter === filter
                                ? isDark
                                  ? "#000"
                                  : "#fff"
                                : theme.textSecondary,
                          }}
                        >
                          {filter.replace("_", " ")}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity: any, idx: number) => {
                      const getIcon = (type: string) => {
                        switch (type?.toLowerCase()) {
                          case "stage":
                            return <History size={14} color={stageColor} />;
                          case "status":
                            return <Clock size={14} color={stageColor} />;
                          case "notes":
                            return (
                              <MessageSquare size={14} color={stageColor} />
                            );
                          case "phonecall":
                            return <PhoneCall size={14} color={stageColor} />;
                          case "whatsapp":
                            return (
                              <MessageSquare size={14} color={stageColor} />
                            );
                          case "sms":
                            return (
                              <MessageSquare size={14} color={stageColor} />
                            );
                          case "mail":
                            return <Mail size={14} color={stageColor} />;
                          case "site_visit":
                            return <Calendar size={14} color={stageColor} />;
                          case "follow_up":
                            return <Clock size={14} color={stageColor} />;
                          case "requirement":
                            return <Info size={14} color={stageColor} />;
                          default:
                            return (
                              <Info size={14} color={theme.textSecondary} />
                            );
                        }
                      };

                      return (
                        <View key={activity.id} className="flex-row">
                          <View className="items-center w-8 mr-4">
                            <View
                              className="items-center justify-center w-8 h-8 border rounded-full"
                              style={{
                                borderColor: theme.border,
                                backgroundColor: theme.cardBg,
                              }}
                            >
                              {getIcon(activity.updates)}
                            </View>
                            {idx !== filteredActivities.length - 1 && (
                              <View
                                className="flex-1 w-px"
                                style={{
                                  backgroundColor: theme.border,
                                  marginVertical: 4,
                                }}
                              />
                            )}
                          </View>
                          <View className="flex-1 pb-6">
                            <View
                              className="p-5 rounded-[28px] border"
                              style={{
                                backgroundColor: theme.cardBg,
                                borderColor: theme.border,
                              }}
                            >
                              <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1">
                                  <View className="flex-row items-center gap-2 mb-1">
                                    <Text
                                      className="text-sm font-bold capitalize"
                                      style={{ color: theme.text }}
                                    >
                                      {activity.updates?.replace("_", " ")}
                                    </Text>
                                    {activity.updates === "site_visit" && (
                                      <View
                                        className="px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: activity.site_visit_completed ? "#dcfce7" : "#fef3c7" }}
                                      >
                                        <Text
                                          className="text-[10px] font-bold"
                                          style={{ color: activity.site_visit_completed ? "#15803d" : "#b45309" }}
                                        >
                                          {activity.site_visit_completed
                                            ? "Completed"
                                            : "Pending"}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text
                                    className="text-[10px]"
                                    style={{ color: theme.textSecondary }}
                                  >
                                    {new Date(
                                      activity.createdAt,
                                    ).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(
                                      activity.createdAt,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  onPress={() =>
                                    handleToggleImportant(activity.id)
                                  }
                                  className="p-1"
                                  disabled={
                                    !canEdit ||
                                    updatingActivityId === activity.id
                                  }
                                >
                                  {updatingActivityId === activity.id ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="#eab308"
                                    />
                                  ) : (
                                    <Star
                                      size={16}
                                      color={
                                        lead?.important_activities?.some(
                                          (ia: any) =>
                                            String(ia.activity_id) ===
                                            String(activity.id),
                                        )
                                          ? "#eab308"
                                          : theme.textSecondary
                                      }
                                      fill={
                                        lead?.important_activities?.some(
                                          (ia: any) =>
                                            String(ia.activity_id) ===
                                            String(activity.id),
                                        )
                                          ? "#eab308"
                                          : "transparent"
                                      }
                                    />
                                  )}
                                </TouchableOpacity>
                              </View>

                              {activity.notes && (
                                <Text
                                  className="mb-2 text-sm italic"
                                  style={{ color: theme.textSecondary }}
                                >
                                  "{activity.notes}"
                                </Text>
                              )}

                              {activity.updates === "site_visit" &&
                                !activity.site_visit_completed &&
                                canEdit && (
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleMarkSiteVisitCompleted(activity.id)
                                    }
                                    className="items-center px-4 py-2 mt-2 border rounded-xl"
                                    style={{ borderColor: theme.green }}
                                  >
                                    <Text
                                      className="text-xs font-bold"
                                      style={{ color: theme.green }}
                                    >
                                      Mark as Completed
                                    </Text>
                                  </TouchableOpacity>
                                )}

                              {activity.site_visit_completed &&
                                activity.site_visit_completed_by_name && (
                                  <View
                                    className="flex-row items-center pt-2 mt-2 border-t"
                                    style={{ borderColor: theme.border }}
                                  >
                                    <CheckSquare
                                      size={10}
                                      color={theme.green}
                                      className="mr-1"
                                    />
                                    <Text
                                      className="text-[10px]"
                                      style={{ color: theme.textSecondary }}
                                    >
                                      Visited on{" "}
                                      {new Date(
                                        activity.site_visit_completed_at,
                                      ).toLocaleDateString()}{" "}
                                      by {activity.site_visit_completed_by_name}
                                    </Text>
                                  </View>
                                )}

                              <View className="flex-row items-center mt-3">
                                <User
                                  size={10}
                                  color={theme.textSecondary}
                                  className="mr-1"
                                />
                                <Text
                                  className="text-[10px]"
                                  style={{ color: theme.textSecondary }}
                                >
                                  By {activity.user_name || "System"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View className="items-center justify-center py-20">
                      <History size={48} color={theme.border} />
                      <Text
                        className="mt-4"
                        style={{ color: theme.textSecondary }}
                      >
                        No activities found for this filter
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        />
      </View>

      {/* Stage Selection Modal */}
      <Modal
        visible={showStageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStageModal(false)}
      >
        <Pressable
          className="justify-end flex-1 bg-black/50"
          onPress={() => setShowStageModal(false)}
        >
          <Pressable
            className="p-6 rounded-t-3xl"
            style={{ backgroundColor: theme.cardBg }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className="mb-4 text-xl font-bold"
              style={{ color: theme.text }}
            >
              Select Stage
            </Text>
            <ScrollView className="max-h-96">
              {(stages.length > 0
                ? (() => {
                    const currentStageObj = stages.find(
                      (s) =>
                        s.name?.toLowerCase() === lead?.stage?.toLowerCase(),
                    );
                    if (!currentStageObj) return stages; // Case mismatch or stage deleted — show all
                    if (
                      !currentStageObj.nextStages ||
                      currentStageObj.nextStages.length === 0
                    )
                      return []; // Match web behavior
                    return stages.filter((s) =>
                      currentStageObj.nextStages.includes(s.id || s._id),
                    );
                  })()
                : []
              ).map((s: any) => (
                <TouchableOpacity
                  key={s.id || s._id || s.name}
                  onPress={() => handleUpdateStage(s.name)}
                  className="flex-row items-center justify-between py-4 border-b"
                  style={{ borderColor: theme.border }}
                >
                  <Text className="text-lg" style={{ color: theme.text }}>
                    {s.name}
                  </Text>
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color || theme.purple }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowStageModal(false)}
              className="items-center py-4 mt-6"
            >
              <Text
                className="font-bold"
                style={{ color: theme.textSecondary }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <Pressable
          className="justify-end flex-1 bg-black/50"
          onPress={() => setShowStatusModal(false)}
        >
          <Pressable
            className="p-6 rounded-t-3xl"
            style={{ backgroundColor: theme.cardBg }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className="mb-4 text-xl font-bold"
              style={{ color: theme.text }}
            >
              Select Status
            </Text>
            <ScrollView>
              {["Hot", "Warm", "Cold"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleUpdateStatus(s)}
                  className="py-4 border-b"
                  style={{ borderColor: theme.border }}
                >
                  <Text className="text-lg" style={{ color: theme.text }}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowStatusModal(false)}
              className="items-center py-4 mt-6"
            >
              <Text
                className="font-bold"
                style={{ color: theme.textSecondary }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Requirements Modal */}
      <Modal
        visible={showReqModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReqModal(false)}
      >
        <Pressable
          className="justify-end flex-1 bg-black/50"
          onPress={() => setShowReqModal(false)}
        >
          <Pressable
            className="p-6 rounded-t-[40px] h-[90%]"
            style={{ backgroundColor: theme.cardBg }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />
            <Text
              className="mb-1 text-2xl font-black"
              style={{ color: theme.text }}
            >
              Lead Requirements
            </Text>
            <Text
              className="mb-6 text-sm"
              style={{ color: theme.textSecondary }}
            >
              Specify what the lead is looking for.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* SQFT */}
              <View className="mb-4">
                <Text
                  className="mb-1 text-xs font-semibold"
                  style={{ color: theme.textSecondary }}
                >
                  Square Footage
                </Text>
                <TextInput
                  className="p-3 border rounded-xl"
                  style={{ borderColor: theme.border, color: theme.text }}
                  value={reqForm.sqft}
                  onChangeText={(v) => setReqForm({ ...reqForm, sqft: v })}
                  keyboardType="numeric"
                  placeholder="e.g. 1200"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* BHK Selection */}
              <Text
                className="mb-2 text-xs font-semibold"
                style={{ color: theme.textSecondary }}
              >
                BHK Type
              </Text>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
                {[
                  "1BHK",
                  "2BHK",
                  "3BHK",
                  "4BHK",
                  "5BHK",
                  "6+ BHK",
                  "Studio",
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      const newVal = (reqForm.bhk || []).includes(opt)
                        ? reqForm.bhk.filter((x: string) => x !== opt)
                        : [...(reqForm.bhk || []), opt];
                      setReqForm({ ...reqForm, bhk: newVal });
                    }}
                    className="px-4 py-2 border rounded-xl"
                    style={{
                      backgroundColor: (reqForm.bhk || []).includes(opt)
                        ? theme.accent
                        : theme.bg,
                      borderColor: (reqForm.bhk || []).includes(opt)
                        ? theme.accent
                        : theme.border,
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{
                        color: (reqForm.bhk || []).includes(opt)
                          ? isDark
                            ? "#000"
                            : "#fff"
                          : theme.text,
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Floor Selection */}
              <Text
                className="mb-2 text-xs font-semibold"
                style={{ color: theme.textSecondary }}
              >
                Preferred Floors
              </Text>
              <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
                <TextInput
                  className="flex-1 p-3 border rounded-xl"
                  style={{ borderColor: theme.border, color: theme.text }}
                  value={floorInput}
                  onChangeText={setFloorInput}
                  keyboardType="numeric"
                  placeholder="Add floor #"
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (floorInput && !reqForm.floor.includes(floorInput)) {
                      setReqForm({
                        ...reqForm,
                        floor: [...reqForm.floor, floorInput],
                      });
                      setFloorInput("");
                    }
                  }}
                  className="p-3 px-6 rounded-xl"
                  style={{ backgroundColor: theme.accent }}
                >
                  <Text
                    className="font-bold"
                    style={{ color: isDark ? "#000" : "#fff" }}
                  >
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
                {reqForm.floor.map((f: string) => (
                  <View
                    key={f}
                    className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                  >
                    <Text
                      className="mr-2 text-xs font-bold"
                      style={{ color: theme.text }}
                    >
                      Floor {f}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setReqForm({
                          ...reqForm,
                          floor: reqForm.floor.filter((x: string) => x !== f),
                        })
                      }
                    >
                      <Trash2 size={12} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Balcony */}
              <TouchableOpacity
                onPress={() =>
                  setReqForm({ ...reqForm, balcony: !reqForm.balcony })
                }
                className="flex-row items-center p-3 mb-4 border rounded-xl"
                style={{
                  borderColor: theme.border,
                  backgroundColor: reqForm.balcony
                    ? theme.accent + "15"
                    : "transparent",
                }}
              >
                <View
                  className="items-center justify-center w-5 h-5 mr-3 border rounded"
                  style={{
                    borderColor: reqForm.balcony ? theme.accent : theme.border,
                    backgroundColor: reqForm.balcony
                      ? theme.accent
                      : "transparent",
                  }}
                >
                  {reqForm.balcony && (
                    <Text
                      style={{ color: isDark ? "#000" : "#fff", fontSize: 10 }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  className="text-sm font-medium"
                  style={{ color: theme.text }}
                >
                  Balcony Required
                </Text>
              </TouchableOpacity>

              {/* Bathrooms */}
              <View className="mb-4">
                <Text
                  className="mb-1 text-xs font-semibold"
                  style={{ color: theme.textSecondary }}
                >
                  Bathrooms
                </Text>
                <TextInput
                  className="p-3 border rounded-xl"
                  style={{ borderColor: theme.border, color: theme.text }}
                  value={reqForm.bathroom_count}
                  onChangeText={(v) =>
                    setReqForm({ ...reqForm, bathroom_count: v })
                  }
                  keyboardType="numeric"
                  placeholder="e.g. 2"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* Parking */}
              <TouchableOpacity
                onPress={() =>
                  setReqForm({
                    ...reqForm,
                    parking_needed: !reqForm.parking_needed,
                    parking_count: !reqForm.parking_needed
                      ? reqForm.parking_count
                      : "",
                  })
                }
                className="flex-row items-center p-3 mb-2 border rounded-xl"
                style={{
                  borderColor: theme.border,
                  backgroundColor: reqForm.parking_needed
                    ? theme.accent + "15"
                    : "transparent",
                }}
              >
                <View
                  className="items-center justify-center w-5 h-5 mr-3 border rounded"
                  style={{
                    borderColor: reqForm.parking_needed
                      ? theme.accent
                      : theme.border,
                    backgroundColor: reqForm.parking_needed
                      ? theme.accent
                      : "transparent",
                  }}
                >
                  {reqForm.parking_needed && (
                    <Text
                      style={{ color: isDark ? "#000" : "#fff", fontSize: 10 }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  className="text-sm font-medium"
                  style={{ color: theme.text }}
                >
                  Parking Needed
                </Text>
              </TouchableOpacity>
              {reqForm.parking_needed && (
                <View className="mb-4 ml-2">
                  <Text
                    className="mb-1 text-xs font-semibold"
                    style={{ color: theme.textSecondary }}
                  >
                    How many?
                  </Text>
                  <TextInput
                    className="p-3 border rounded-xl"
                    style={{ borderColor: theme.border, color: theme.text }}
                    value={reqForm.parking_count}
                    onChangeText={(v) =>
                      setReqForm({ ...reqForm, parking_count: v })
                    }
                    keyboardType="numeric"
                    placeholder="e.g. 2"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              )}

              {/* Price Range */}
              <View className="mb-4">
                <Text
                  className="mb-1 text-xs font-semibold"
                  style={{ color: theme.textSecondary }}
                >
                  Price Range (₹)
                </Text>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <TextInput
                    className="flex-1 p-3 border rounded-xl"
                    style={{ borderColor: theme.border, color: theme.text }}
                    value={reqForm.price_min}
                    onChangeText={(v) =>
                      setReqForm({ ...reqForm, price_min: v })
                    }
                    keyboardType="numeric"
                    placeholder="Min"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <Text style={{ color: theme.textSecondary }}>—</Text>
                  <TextInput
                    className="flex-1 p-3 border rounded-xl"
                    style={{ borderColor: theme.border, color: theme.text }}
                    value={reqForm.price_max}
                    onChangeText={(v) =>
                      setReqForm({ ...reqForm, price_max: v })
                    }
                    keyboardType="numeric"
                    placeholder="Max"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              {/* Furniture */}
              <Text
                className="mb-2 text-xs font-semibold"
                style={{ color: theme.textSecondary }}
              >
                Furniture
              </Text>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
                {[
                  "Semi-furnished",
                  "Fully furnished",
                  "Both",
                  "No furniture",
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      const newVal = (reqForm.furniture || []).includes(opt)
                        ? reqForm.furniture.filter((x: string) => x !== opt)
                        : [...(reqForm.furniture || []), opt];
                      setReqForm({ ...reqForm, furniture: newVal });
                    }}
                    className="px-3 py-2 border rounded-full"
                    style={{
                      backgroundColor: (reqForm.furniture || []).includes(opt)
                        ? theme.accent
                        : theme.cardBg,
                      borderColor: (reqForm.furniture || []).includes(opt)
                        ? theme.accent
                        : theme.border,
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{
                        color: (reqForm.furniture || []).includes(opt)
                          ? isDark
                            ? "#000"
                            : "#fff"
                          : theme.text,
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Facing */}
              <Text
                className="mb-2 text-xs font-semibold"
                style={{ color: theme.textSecondary }}
              >
                Facing
              </Text>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
                {[
                  "North",
                  "South",
                  "East",
                  "West",
                  "North-East",
                  "North-West",
                  "South-East",
                  "South-West",
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      const newVal = (reqForm.facing || []).includes(opt)
                        ? reqForm.facing.filter((x: string) => x !== opt)
                        : [...(reqForm.facing || []), opt];
                      setReqForm({ ...reqForm, facing: newVal });
                    }}
                    className="px-3 py-2 border rounded-full"
                    style={{
                      backgroundColor: (reqForm.facing || []).includes(opt)
                        ? theme.accent
                        : theme.cardBg,
                      borderColor: (reqForm.facing || []).includes(opt)
                        ? theme.accent
                        : theme.border,
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{
                        color: (reqForm.facing || []).includes(opt)
                          ? isDark
                            ? "#000"
                            : "#fff"
                          : theme.text,
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Plot Type */}
              <View className="mb-6">
                <Text
                  className="mb-1 text-xs font-semibold"
                  style={{ color: theme.textSecondary }}
                >
                  Plot Type
                </Text>
                <TextInput
                  className="p-3 border rounded-xl"
                  style={{ borderColor: theme.border, color: theme.text }}
                  value={reqForm.plot_type}
                  onChangeText={(v) => setReqForm({ ...reqForm, plot_type: v })}
                  placeholder="e.g. Residential, Commercial"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <TouchableOpacity
                onPress={handleUpdateRequirements}
                className="items-center py-4 rounded-2xl"
                style={{ backgroundColor: theme.accent }}
              >
                <Text
                  className="font-bold"
                  style={{ color: isDark ? "#000" : "#fff" }}
                >
                  Save Requirements
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowReqModal(false)}
                className="items-center py-4 mt-2 mb-4"
              >
                <Text
                  className="font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Projects Selection Modal */}
      <Modal
        visible={showProjectsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProjectsModal(false)}
      >
        <Pressable
          className="justify-end flex-1 bg-black/50"
          onPress={() => setShowProjectsModal(false)}
        >
          <Pressable
            className="p-6 rounded-t-3xl h-[80%]"
            style={{ backgroundColor: theme.cardBg }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className="mb-4 text-xl font-bold"
              style={{ color: theme.text }}
            >
              Add Interested Project
            </Text>
            <ScrollView>
              {allProjects.map((p) => {
                const isAdded = lead?.interested_projects?.some(
                  (ip: any) => ip.project_id === p.product_id,
                );
                return (
                  <TouchableOpacity
                    key={p.product_id}
                    onPress={() =>
                      !isAdded && handleAddProject(p.product_id, p.name)
                    }
                    className="flex-row items-center justify-between py-4 border-b"
                    style={{
                      borderColor: theme.border,
                      opacity: isAdded ? 0.5 : 1,
                    }}
                  >
                    <View>
                      <Text
                        className="text-lg font-bold"
                        style={{ color: theme.text }}
                      >
                        {p.name}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: theme.textSecondary }}
                      >
                        ID: {p.product_id}
                      </Text>
                    </View>
                    {isAdded ? (
                      <Text
                        className="text-xs font-bold"
                        style={{ color: theme.green }}
                      >
                        Added
                      </Text>
                    ) : (
                      <Plus size={20} color={theme.purple} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowProjectsModal(false)}
              className="items-center py-4 mt-6"
            >
              <Text
                className="font-bold"
                style={{ color: theme.textSecondary }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <Pressable
          className="justify-end flex-1 bg-black/50"
          onPress={() => setShowNotesModal(false)}
        >
          <Pressable
            className="p-6 rounded-t-3xl h-[60%]"
            style={{ backgroundColor: theme.cardBg }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className="mb-4 text-xl font-bold"
              style={{ color: theme.text }}
            >
              Add Note
            </Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Type your note here..."
              placeholderTextColor={theme.textSecondary}
              multiline
              className="flex-1 p-4 text-base border rounded-2xl"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
                textAlignVertical: "top",
              }}
            />
            <View className="flex-row gap-4 mt-6">
              <TouchableOpacity
                onPress={() => setShowNotesModal(false)}
                className="items-center flex-1 py-4 rounded-xl"
                style={{ backgroundColor: theme.bg }}
              >
                <Text className="font-bold" style={{ color: theme.text }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddNote}
                className="items-center flex-1 py-4 rounded-xl"
                style={{ backgroundColor: theme.accent }}
              >
                <Text
                  className="font-bold"
                  style={{ color: isDark ? "#000" : "#fff" }}
                >
                  Save Note
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}
