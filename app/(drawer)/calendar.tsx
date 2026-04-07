import ScreenWrapper from "@/components/sidebar/ScreenWrapper";
import { useRouter } from "expo-router";
import { Building2, ExternalLink, MapPin, User } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    AgendaList,
    CalendarProvider,
    ExpandableCalendar,
} from "react-native-calendars";
import { useAuth } from "../../context/AuthContext";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { BASE_URL } from "../../src/config/apiConfig";

// Types
type ActivityType = "visit" | "booking";

interface CalendarItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  time: string;
  isCompleted: boolean;
  leadUuid?: string;
  projectName?: string;
  data: any;
}

const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function CalendarScreen() {
  const { token, organization } = useAuth();
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [totalVisits, setTotalVisits] = useState(0);
  const [counts, setCounts] = useState({
    booked: 0,
    completed: 0,
    scheduled: 0,
  });

  const themeColors = React.useMemo(
    () => ({
      bg: isDark ? "#000000" : "#f4f6f9",
      cardBg: isDark ? "#111111" : "#ffffff",
      text: isDark ? "#ffffff" : "#111111",
      textMuted: isDark ? "#888888" : "#64748b",
      border: isDark ? "#222222" : "#e2e8f0",
      primary: isDark ? "#ffffff" : "#000000",
      accentCompleted: "#10B981",
      accentBooked: "#F59E0B",
      accentScheduled: "#3B82F6",
    }),
    [isDark],
  );

  const fetchCalendarData = useCallback(async () => {
    if (!token || !organization) return;
    try {
      setLoading(true);

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Fetch Site Visits (GraphQL)
      const visitsRes = await fetch(`${BASE_URL}/graphql`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: `query GetSiteVisitActivities($organization: String!) { getSiteVisitActivities(organization: $organization) { id lead_id lead_name user_name site_visit_date site_visit_completed site_visit_project_name } }`,
          variables: { organization },
        }),
      });
      const visitsJson = await visitsRes.json();
      const visits = visitsJson.data?.getSiteVisitActivities || [];

      // 2. Fetch Booked Units (REST)
      const bookedRes = await fetch(
        `${BASE_URL}/api/projects/booked/all?organization=${organization}`,
        { headers },
      );
      const bookedJson = await bookedRes.json();
      const bookedUnits = bookedJson.data || [];

      const matchedItems: Record<string, any[]> = {};
      const parseDateStr = (dateInput: string) => {
        const date = new Date(dateInput);
        const day = formatDateKey(date);
        const time = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return { day, time };
      };

      visits.forEach((v: any) => {
        if (!v.site_visit_date) return;
        const { day, time } = parseDateStr(v.site_visit_date);
        if (!matchedItems[day]) matchedItems[day] = [];
        matchedItems[day].push({
          id: v.id,
          type: "visit",
          title: v.lead_name || "Unknown",
          subtitle: `Assigned: ${v.user_name || "Unassigned"}`,
          time,
          isCompleted: v.site_visit_completed,
          projectName: v.site_visit_project_name,
          leadUuid: v.lead_id,
          data: v,
        });
      });

      bookedUnits.forEach((b: any) => {
        if (!b.bookedBy?.bookedAt) return;
        const { day, time } = parseDateStr(b.bookedBy.bookedAt);
        if (!matchedItems[day]) matchedItems[day] = [];
        matchedItems[day].push({
          id: b.id,
          type: "booking",
          title: b.bookedBy?.leadName || "Unknown",
          subtitle: `Booked: ${b.label}`,
          time,
          isCompleted: true,
          leadUuid: b.bookedBy?.leadUuid,
          projectName: b.project_name,
          data: b,
        });
      });

      const sortedDates = Object.keys(matchedItems).sort();
      const sections = sortedDates.map((date) => ({
        title: date,
        data: matchedItems[date],
      }));

      const marks: any = {};
      let bCount = 0,
        cCount = 0,
        sCount = 0;
      sortedDates.forEach((date) => {
        const dayItems = matchedItems[date];
        const dots: any[] = [];
        if (dayItems.some((i) => i.type === "booking")) {
          dots.push({ color: themeColors.accentBooked });
          bCount += dayItems.filter((i) => i.type === "booking").length;
        }
        if (dayItems.some((i) => i.type === "visit" && i.isCompleted)) {
          dots.push({ color: themeColors.accentCompleted });
          cCount += dayItems.filter(
            (i) => i.type === "visit" && i.isCompleted,
          ).length;
        }
        if (dayItems.some((i) => i.type === "visit" && !i.isCompleted)) {
          dots.push({ color: themeColors.accentScheduled });
          sCount += dayItems.filter(
            (i) => i.type === "visit" && !i.isCompleted,
          ).length;
        }
        if (dots.length > 0) marks[date] = { dots };
      });

      setItems(sections);
      setMarkedDates(marks);
      setTotalVisits(visits.length);
      setCounts({ booked: bCount, completed: cCount, scheduled: sCount });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token, organization, themeColors]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const renderItem = useCallback(
    (item: CalendarItem) => {
      const isBooking = item.type === "booking";
      const accentColor = isBooking
        ? themeColors.accentBooked
        : item.isCompleted
          ? themeColors.accentCompleted
          : themeColors.accentScheduled;
      return (
        <View
          style={[
            styles.itemContainer,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View
            style={[styles.statusIndicator, { backgroundColor: accentColor }]}
          />
          <View style={styles.itemContent}>
            <View style={styles.headerRow}>
              <Text
                style={[styles.itemTitle, { color: themeColors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.itemTime, { color: themeColors.textMuted }]}>
                {item.time}
              </Text>
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.badgeWrapper}>
                <Text
                  style={[
                    styles.badgeText,
                    { color: accentColor, backgroundColor: `${accentColor}1A` },
                  ]}
                >
                  {isBooking
                    ? "Booked Unit"
                    : item.isCompleted
                      ? "Completed Visit"
                      : "Scheduled Visit"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <User size={12} color={themeColors.textMuted} />
                <Text
                  style={[styles.detailText, { color: themeColors.textMuted }]}
                >
                  {item.subtitle}
                </Text>
              </View>
              {item.projectName && (
                <View style={styles.detailRow}>
                  <Building2 size={12} color={themeColors.textMuted} />
                  <Text
                    style={[
                      styles.detailText,
                      { color: themeColors.textMuted },
                    ]}
                  >
                    {item.projectName}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {item.leadUuid && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() =>
                router.push({
                  pathname: "/(drawer)/leads/lead_detail",
                  params: { id: item.leadUuid, from: 'calendar' },
                } as any)
              }
            >
              <ExternalLink size={20} color={themeColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [themeColors, router],
  );

  const todayStr = React.useMemo(() => formatDateKey(new Date()), []);

  return (
    <ScreenWrapper
      title="Calendar"
      showBackButton={false}
      headerRight={
        <View style={styles.headerRight}>
          <MapPin size={16} color={themeColors.textMuted} />
          <Text
            style={[styles.headerRightText, { color: themeColors.textMuted }]}
          >
            {totalVisits}
          </Text>
        </View>
      }
    >
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
          <CalendarProvider
            date={todayStr}
            showTodayButton
            todayButtonStyle={{
                backgroundColor: isDark ? '#222' : '#fff',
            }}
            theme={{ todayButtonTextColor: themeColors.primary }}
          >
            <ExpandableCalendar
              key={isDark ? "dark" : "light"}
              markedDates={markedDates}
              markingType={"multi-dot"}
              theme={{
                calendarBackground: themeColors.cardBg,
                backgroundColor: themeColors.bg,
                textSectionTitleColor: themeColors.textMuted,
                selectedDayBackgroundColor: themeColors.primary,
                selectedDayTextColor: isDark ? "#000" : "#fff",
                todayTextColor: themeColors.primary,
                dayTextColor: themeColors.text,
                textDisabledColor: themeColors.textMuted,
                dotColor: themeColors.primary,
                selectedDotColor: isDark ? "#000" : "#fff",
                arrowColor: themeColors.primary,
                monthTextColor: themeColors.text,
                indicatorColor: themeColors.primary,
              }}
            />
            <View
              style={[
                styles.legendContainer,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                },
              ]}
            >
              {[
                {
                  color: themeColors.accentBooked,
                  label: `Booked (${counts.booked})`,
                },
                {
                  color: themeColors.accentCompleted,
                  label: `Completed (${counts.completed})`,
                },
                {
                  color: themeColors.accentScheduled,
                  label: `Scheduled (${counts.scheduled})`,
                },
              ].map((leg, i) => (
                <View key={i} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: leg.color }]}
                  />
                  <Text
                    style={[
                      styles.legendLabel,
                      { color: themeColors.textMuted },
                    ]}
                  >
                    {leg.label}
                  </Text>
                </View>
              ))}
            </View>
            <AgendaList
              sections={items}
              renderItem={({ item }) => renderItem(item as CalendarItem)}
              sectionStyle={{ backgroundColor: themeColors.bg }}
              renderSectionHeader={(info: any) => {
                const title = typeof info === 'string' ? info : info?.section?.title;
                if (!title) return null;
                
                const date = new Date(title);
                const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                const formattedTitle = date.toLocaleDateString('en-US', options).toUpperCase();
                return (
                  <View style={[styles.sectionHeader, { backgroundColor: themeColors.bg }]}>
                    <Text style={[styles.sectionHeaderText, { color: themeColors.accentScheduled, textAlign: 'center' }]}>
                      {formattedTitle}
                    </Text>
                  </View>
                );
              }}
            />
          </CalendarProvider>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemContainer: {
    marginRight: 16,
    marginTop: 17,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 80,
  },
  statusIndicator: { width: 6, height: "100%" },
  itemContent: { flex: 1, padding: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemTitle: { fontSize: 15, fontWeight: "bold", flex: 1, marginRight: 8 },
  itemTime: { fontSize: 12, fontWeight: "500" },
  detailsContainer: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13 },
  badgeWrapper: { alignSelf: "flex-start", marginBottom: 4 },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: "600" },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  },
  headerRightText: { fontSize: 14, fontWeight: "600" },
  navBtn: { padding: 16, justifyContent: "center", alignItems: "center" },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
