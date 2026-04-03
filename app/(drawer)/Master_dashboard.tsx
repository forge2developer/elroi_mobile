import ScreenWrapper from '@/components/sidebar/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Search,
    X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

// ─── API ────────────────────────────────────────────────────────────────────────
import { BASE_URL } from '@/src/config/apiConfig';
const API_BASE_URL = BASE_URL;

// ─── Monochrome Theme (matching app UI) ─────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#000000' : '#f4f6f9',
        cardBg: isDark ? '#111111' : '#ffffff',
        headerBg: isDark ? '#000000' : '#ffffff',
        border: isDark ? '#1e1e1e' : '#e2e8f0',
        text: isDark ? '#ffffff' : '#111111',
        textSecondary: isDark ? '#888888' : '#64748b',
        accent: isDark ? '#ffffff' : '#111111',
        accentLight: isDark ? '#222222' : '#f0f0f0',
        success: '#22c55e',
        successLight: isDark ? '#0a1f0a' : '#f0fdf4',
        warning: '#f59e0b',
        warningLight: isDark ? '#1a1400' : '#fffbeb',
        danger: '#ef4444',
        dangerLight: isDark ? '#1f0a0a' : '#fef2f2',
        info: '#3b82f6',
        infoLight: isDark ? '#0a1429' : '#eff6ff',
        shadow: isDark ? 'transparent' : 'rgba(0,0,0,0.06)',
        modalOverlay: 'rgba(0,0,0,0.6)',
        modalBg: isDark ? '#111111' : '#ffffff',
        inputBg: isDark ? '#1a1a1a' : '#f4f6f9',
        pillActive: isDark ? '#ffffff' : '#111111',
        pillActiveText: isDark ? '#000000' : '#ffffff',
        pillInactive: isDark ? '#1a1a1a' : '#f0f0f0',
        pillInactiveText: isDark ? '#888888' : '#64748b',
        chartBg: isDark ? '#0a0a0a' : '#fafbfc',
    };
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface PieDataItem { label: string; value: number; color: string; }
interface Executive { id: string; name: string; role?: string; department?: string; }
interface DashboardStats {
    allLeads: number; reengagedLeads: number; newEnquiries: number;
    activeProspects: number; missedCalls: number; missedFollowups: number;
}
interface SalesData { siteVisitDone: number; salesTaken: number; }
interface PreSalesData {
    newLead: number; reengaged: number; lost: number;
    siteVisitDone: number; siteVisitSchedule: number; prospect: number; followUps: number;
}

// ─── Defaults ───────────────────────────────────────────────────────────────────
const DEFAULT_STATS: DashboardStats = {
    allLeads: 0, reengagedLeads: 0, newEnquiries: 0,
    activeProspects: 0, missedCalls: 0, missedFollowups: 0,
};
const DEFAULT_SALES: SalesData = { siteVisitDone: 0, salesTaken: 0 };
const DEFAULT_PRESALES: PreSalesData = {
    newLead: 0, reengaged: 0, lost: 0,
    siteVisitDone: 0, siteVisitSchedule: 0, prospect: 0, followUps: 0,
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDateShort(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}
function toDateStr(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function todayStr() {
    const d = new Date();
    return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
}
function last30DaysStr() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
}

// ─── Custom Calendar Picker ─────────────────────────────────────────────────────
function CustomCalendar({
    selectedDate,
    onSelect,
    theme,
    label,
}: {
    selectedDate: string;
    onSelect: (date: string) => void;
    theme: ReturnType<typeof getTheme>;
    label: string;
}) {
    const sel = selectedDate ? new Date(selectedDate) : new Date();
    const [viewYear, setViewYear] = useState(sel.getFullYear());
    const [viewMonth, setViewMonth] = useState(sel.getMonth());
    const [mode, setMode] = useState<'day' | 'month' | 'year'>('day');

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    // Year list: show ±8 years
    const yearList = useMemo(() => {
        const years: number[] = [];
        for (let y = viewYear - 8; y <= viewYear + 8; y++) years.push(y);
        return years;
    }, [viewYear]);

    if (mode === 'year') {
        return (
            <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.accent, marginBottom: 10, textAlign: 'center' }}>
                    {label} — Select Year
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {yearList.map(y => (
                        <Pressable
                            key={y}
                            onPress={() => { setViewYear(y); setMode('month'); }}
                            style={{
                                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                                backgroundColor: y === viewYear ? theme.accent : theme.inputBg,
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '600', color: y === viewYear ? theme.pillActiveText : theme.text }}>{y}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    }

    if (mode === 'month') {
        return (
            <View>
                <Pressable onPress={() => setMode('year')} style={{ alignSelf: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.accent }}>{viewYear} ▾</Text>
                </Pressable>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 10, textAlign: 'center' }}>
                    {label} — Select Month
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {FULL_MONTHS.map((m, i) => (
                        <Pressable
                            key={m}
                            onPress={() => { setViewMonth(i); setMode('day'); }}
                            style={{
                                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, width: '30%', alignItems: 'center',
                                backgroundColor: i === viewMonth ? theme.accent : theme.inputBg,
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '600', color: i === viewMonth ? theme.pillActiveText : theme.text }}>{MONTHS[i]}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    }

    // Day view
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return (
        <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent, marginBottom: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
                {label}
            </Text>

            {/* Month/Year header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Pressable onPress={prevMonth} style={{ padding: 6 }}>
                    <ChevronLeft size={18} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => setMode('month')}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                        {FULL_MONTHS[viewMonth]} {viewYear} ▾
                    </Text>
                </Pressable>
                <Pressable onPress={nextMonth} style={{ padding: 6 }}>
                    <ChevronRight size={18} color={theme.text} />
                </Pressable>
            </View>

            {/* Weekday headers */}
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {WEEKDAYS.map(wd => (
                    <View key={wd} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary }}>{wd}</Text>
                    </View>
                ))}
            </View>

            {/* Days grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {days.map((day, i) => {
                    if (day === null) return <View key={`e-${i}`} style={{ width: '14.28%', height: 36 }} />;
                    const dateStr = toDateStr(viewYear, viewMonth, day);
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr();
                    return (
                        <Pressable
                            key={dateStr}
                            onPress={() => onSelect(dateStr)}
                            style={{
                                width: '14.28%', height: 36, justifyContent: 'center', alignItems: 'center',
                            }}
                        >
                            <View style={{
                                width: 32, height: 32, borderRadius: 16,
                                justifyContent: 'center', alignItems: 'center',
                                backgroundColor: isSelected ? theme.accent : isToday ? theme.accentLight : 'transparent',
                                borderWidth: isToday && !isSelected ? 1 : 0,
                                borderColor: theme.accent,
                                overflow: 'hidden',
                            }}>
                                <Text style={{
                                    fontSize: 13, fontWeight: isSelected ? '700' : '500',
                                    color: isSelected ? theme.pillActiveText : theme.text,
                                }}>{day}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Date Picker Modal (Start + End separate) ───────────────────────────────────
function DatePickerModal({
    visible, onClose, onApply, startDate, endDate, theme,
}: {
    visible: boolean; onClose: () => void;
    onApply: (start: string, end: string) => void;
    startDate: string; endDate: string;
    theme: ReturnType<typeof getTheme>;
}) {
    const [tempStart, setTempStart] = useState(startDate);
    const [tempEnd, setTempEnd] = useState(endDate);

    useEffect(() => {
        if (visible) { setTempStart(startDate); setTempEnd(endDate); }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.modalOverlay, padding: 16 }}>
                <View style={{ backgroundColor: theme.modalBg, borderRadius: 20, padding: 20, maxHeight: '90%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>Select Date Range</Text>
                        <Pressable onPress={onClose} style={{ padding: 4 }}>
                            <X size={20} color={theme.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Start Date Calendar */}
                        <View style={{ marginBottom: 20, padding: 12, borderRadius: 14, backgroundColor: theme.chartBg, borderWidth: 1, borderColor: theme.border }}>
                            <CustomCalendar selectedDate={tempStart} onSelect={setTempStart} theme={theme} label="Start Date" />
                        </View>

                        {/* End Date Calendar */}
                        <View style={{ marginBottom: 16, padding: 12, borderRadius: 14, backgroundColor: theme.chartBg, borderWidth: 1, borderColor: theme.border }}>
                            <CustomCalendar selectedDate={tempEnd} onSelect={setTempEnd} theme={theme} label="End Date" />
                        </View>

                        {/* Selected display */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                            <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>FROM</Text>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{formatDateShort(tempStart)}</Text>
                            </View>
                            <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>TO</Text>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{formatDateShort(tempEnd)}</Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Pressable onPress={onClose} style={{ paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, backgroundColor: theme.inputBg }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => {
                            if (tempStart) {
                                let s = tempStart;
                                let e = tempEnd || tempStart;
                                if (new Date(s) > new Date(e)) [s, e] = [e, s];
                                onApply(s, e);
                                onClose();
                            }
                        }}
                            style={{ paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12, backgroundColor: theme.pillActive }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.pillActiveText }}>Apply</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ data, size = 140, strokeWidth = 24, theme }: {
    data: PieDataItem[]; size?: number; strokeWidth?: number; theme: ReturnType<typeof getTheme>;
}) {
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const total = data.reduce((s, d) => s + d.value, 0);

    if (total === 0) {
        return (
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={size} height={size}>
                    <Circle cx={center} cy={center} r={radius} fill="none" stroke={theme.border} strokeWidth={strokeWidth} />
                </Svg>
                <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textSecondary }}>0</Text>
                </View>
            </View>
        );
    }

    let cumulativeAngle = -90;
    const arcs = data.filter(d => d.value > 0).map((item) => {
        const angle = (item.value / total) * 360;
        const start = cumulativeAngle;
        const end = cumulativeAngle + angle;
        cumulativeAngle = end;

        if (angle >= 359.99) {
            return <Circle key={item.label} cx={center} cy={center} r={radius} fill="none" stroke={item.color} strokeWidth={strokeWidth} />;
        }

        const startRad = (start * Math.PI) / 180;
        const endRad = (end * Math.PI) / 180;
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        return (
            <Path key={item.label}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2}`}
                fill="none" stroke={item.color} strokeWidth={strokeWidth} strokeLinecap="round"
            />
        );
    });

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <Circle cx={center} cy={center} r={radius} fill="none" stroke={theme.border} strokeWidth={strokeWidth} opacity={0.4} />
                <G>{arcs}</G>
            </Svg>
            <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>{total}</Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textSecondary, letterSpacing: 1, marginTop: 1 }}>TOTAL</Text>
            </View>
        </View>
    );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, theme, color, bgColor }: {
    label: string; value: number | string; theme: ReturnType<typeof getTheme>; color: string; bgColor: string;
}) {
    return (
        <View style={{
            flex: 1, minWidth: '46%', backgroundColor: bgColor, borderRadius: 16,
            borderWidth: 1, borderColor: theme.border, padding: 16,
            shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
        }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
        </View>
    );
}

// ─── Toggle Pills ───────────────────────────────────────────────────────────────
function TogglePills({ options, activeIndex, onPress, theme }: {
    options: string[]; activeIndex: number; onPress: (i: number) => void; theme: ReturnType<typeof getTheme>;
}) {
    return (
        <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
            {options.map((opt, i) => (
                <Pressable key={opt} onPress={() => onPress(i)}
                    style={{
                        paddingHorizontal: 18, paddingVertical: 9,
                        backgroundColor: activeIndex === i ? theme.pillActive : theme.pillInactive,
                    }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: activeIndex === i ? theme.pillActiveText : theme.pillInactiveText }}>
                        {opt}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

// ─── Executive List Modal ───────────────────────────────────────────────────────
function ExecutiveListModal({ visible, onClose, executives, onSelectExec, theme, title = 'Select Executive', searchPlaceholder = 'Search executive...', emptyText = 'No executives found', defaultRole = 'Executive' }: {
    visible: boolean; onClose: () => void; executives: Executive[];
    onSelectExec: (exec: Executive) => void; theme: ReturnType<typeof getTheme>;
    title?: string; searchPlaceholder?: string; emptyText?: string; defaultRole?: string;
}) {
    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        if (!search.trim()) return executives;
        const q = search.toLowerCase();
        return executives.filter(e => e.name.toLowerCase().includes(q));
    }, [executives, search]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: theme.modalOverlay }}>
                <View style={{ backgroundColor: theme.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', padding: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>{title}</Text>
                        <Pressable onPress={onClose} style={{ padding: 4 }}><X size={20} color={theme.textSecondary} /></Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={16} color={theme.textSecondary} />
                        <TextInput placeholder={searchPlaceholder} placeholderTextColor={theme.textSecondary}
                            value={search} onChangeText={setSearch}
                            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: theme.text }} />
                        {search.length > 0 && <Pressable onPress={() => setSearch('')}><X size={16} color={theme.textSecondary} /></Pressable>}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {filtered.length === 0 ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, color: theme.textSecondary }}>{emptyText}</Text>
                            </View>
                        ) : filtered.map(exec => (
                            <Pressable key={exec.id} onPress={() => { onSelectExec(exec); onClose(); setSearch(''); }}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 12 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{exec.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{exec.name}</Text>
                                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1, textTransform: 'capitalize' }}>
                                        {exec.department || exec.role || defaultRole}
                                    </Text>
                                </View>
                                <ChevronRight size={16} color={theme.textSecondary} />
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
    );
}

// ─── Chart Section ──────────────────────────────────────────────────────────────
function DashboardChartSection({ title, chartData, detailItems, executives, theme, isDark, onDateChange, onExecChange, defaultExecLabel = 'All Executive', modalTitle = 'Select Executive', searchPlaceholder = 'Search executive...', emptyText = 'No executives found', defaultRole = 'Executive' }: {
    title: string; chartData: PieDataItem[]; detailItems: { label: string; value: number; color: string }[];
    executives: Executive[]; theme: ReturnType<typeof getTheme>; isDark: boolean;
    onDateChange?: (start: string, end: string) => void;
    onExecChange?: (execId: string | null) => void;
    defaultExecLabel?: string; modalTitle?: string; searchPlaceholder?: string; emptyText?: string; defaultRole?: string;
}) {
    const today = todayStr();
    const start = last30DaysStr();
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(today);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [execListVisible, setExecListVisible] = useState(false);
    const [selectedExec, setSelectedExec] = useState<Executive | null>(null);

    const totalValue = detailItems.reduce((s, d) => s + d.value, 0);

    return (
        <View style={{
            backgroundColor: theme.cardBg, borderRadius: 20, borderWidth: 1, borderColor: theme.border,
            padding: 18, marginTop: 18,
            shadowColor: theme.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
        }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: theme.text, letterSpacing: -0.3 }}>{title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {(startDate !== start || endDate !== today) && (
                        <Pressable onPress={() => { setStartDate(start); setEndDate(today); onDateChange?.(start, today); }}
                            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textSecondary }}>Reset Date</Text>
                        </Pressable>
                    )}
                    <Pressable onPress={() => setCalendarVisible(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                        <CalendarIcon size={13} color={theme.accent} />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textSecondary }}>
                            {formatDateShort(startDate)} - {formatDateShort(endDate)}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* All Executive Button */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 14, gap: 8 }}>
                {selectedExec && (
                    <Pressable onPress={() => { setSelectedExec(null); onExecChange?.(null); }}
                        style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>Reset</Text>
                    </Pressable>
                )}
                <Pressable onPress={() => setExecListVisible(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: theme.pillActive, borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.pillActiveText }}>
                        {selectedExec ? selectedExec.name : defaultExecLabel}
                    </Text>
                    <ChevronDown size={13} color={theme.pillActiveText} />
                </Pressable>
            </View>

            {/* Chart + Details */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 16 }}>
                <DonutChart data={chartData} size={130} strokeWidth={22} theme={theme} />
                <View style={{ flex: 1, gap: 5 }}>
                    {detailItems.map(item => (
                        <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: theme.inputBg }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                                <Text style={{ fontSize: 11, color: theme.textSecondary }} numberOfLines={1}>{item.label}</Text>
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{item.value}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Total */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text, letterSpacing: 0.5 }}>Total</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: theme.text }}>{totalValue}</Text>
            </View>

            {/* Modals */}
            <DatePickerModal visible={calendarVisible} onClose={() => setCalendarVisible(false)}
                onApply={(s, e) => { setStartDate(s); setEndDate(e); onDateChange?.(s, e); }}
                startDate={startDate} endDate={endDate} theme={theme} />
            <ExecutiveListModal visible={execListVisible} onClose={() => setExecListVisible(false)}
                executives={executives} title={modalTitle} searchPlaceholder={searchPlaceholder} emptyText={emptyText} defaultRole={defaultRole}
                onSelectExec={(exec) => { setSelectedExec(exec); onExecChange?.(exec.id); }} theme={theme} />
        </View>
    );
}

// ─── Colors ─────────────────────────────────────────────────────────────────────
const SALES_COLORS = { siteVisitDone: '#10B981', salesTaken: '#3B82F6' };
const PRESALES_COLORS = {
    newLead: '#6366F1', reengaged: '#10B981', lost: '#EF4444',
    siteVisitDone: '#F59E0B', siteVisitSchedule: '#14B8A6', prospect: '#8B5CF6', followUps: '#F43F5E',
};

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function MasterDashboardScreen() {
    const colorScheme = useColorScheme();
    const { role, token, organization, userId, isLoading: authLoading } = useAuth();
    const isDark = colorScheme === 'dark';
    const theme = getTheme(isDark);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
    const [salesData, setSalesData] = useState<SalesData>(DEFAULT_SALES);
    const [preSalesData, setPreSalesData] = useState<PreSalesData>(DEFAULT_PRESALES);
    const [marketingData, setMarketingData] = useState<PieDataItem[]>([]);
    const [executives, setExecutives] = useState<Executive[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const isAdmin = role === 'admin' || role === 'Admin' || role === 'manager' || role === 'Manager' || !role;

    // ── API Helper ──────────────────────────────────────────────────────────────
    const getHeaders = useCallback(() => {
        const h: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    }, [token]);

    // ── Fetch All Data ──────────────────────────────────────────────────────────
    const fetchWithTimeout = async (url: string, options: any, timeout = 8000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e: any) {
            clearTimeout(id);
            throw e;
        }
    };

    const fetchDashboardData = useCallback(async () => {
        if (!organization || !token) {
            console.log('[Dashboard] Skipping fetch: Organization or Token not available');
            return;
        }
        setLoading(true);
        setFetchError(null);
        try {
            const headers = getHeaders();
            const encodedOrg = encodeURIComponent(organization);
            const today = todayStr();
            const start = last30DaysStr();

            // Fire off all initial fetches in parallel
            const [statsRes, salesRes, preSalesRes, execsRes, marketingRes] = await Promise.all([
                fetchWithTimeout(`${API_BASE_URL}/api/dashboard/admin-stats?organization=${encodedOrg}`, { headers }).catch(e => { console.log('Stats Error:', e); return null; }),
                fetchWithTimeout(`${API_BASE_URL}/api/dashboard/sales-summary?organization=${encodedOrg}&startDate=${start}&endDate=${today}`, { headers }).catch(e => { console.log('Sales Error:', e); return null; }),
                fetchWithTimeout(`${API_BASE_URL}/api/dashboard/presales-summary?organization=${encodedOrg}&startDate=${start}&endDate=${today}`, { headers }).catch(e => { console.log('PreSales Error:', e); return null; }),
                fetchWithTimeout(`${API_BASE_URL}/api/dashboard/executives?organization=${encodedOrg}`, { headers }).catch(e => { console.log('Execs Error:', e); return null; }),
                fetchWithTimeout(`${API_BASE_URL}/api/dashboard/marketing-summary?organization=${encodedOrg}&startDate=${start}&endDate=${today}`, { headers }).catch(e => { console.log('Marketing Error:', e); return null; }),
            ]);

            const errors: string[] = [];

            if (statsRes?.ok) {
                const json = await statsRes.json();
                const d = json.data || json;
                setStats({
                    allLeads: d.allLeads ?? 0,
                    reengagedLeads: d.reengagedLeads ?? 0,
                    newEnquiries: d.newEnquiries ?? 0,
                    activeProspects: d.activeProspects ?? 0,
                    missedCalls: d.missedCalls ?? 0,
                    missedFollowups: d.missedFollowups ?? 0,
                });
            } else if (statsRes) {
                errors.push(`Stats: ${statsRes.status}`);
            } else {
                errors.push('Stats: Network Error');
            }

            if (salesRes?.ok) {
                const json = await salesRes.json();
                const d = json.data || json;
                setSalesData({ siteVisitDone: d.siteVisitDone ?? 0, salesTaken: d.salesTaken ?? 0 });
            } else if (salesRes) {
                errors.push(`Sales: ${salesRes.status}`);
            }

            if (preSalesRes?.ok) {
                const json = await preSalesRes.json();
                const d = json.data || json;
                setPreSalesData({
                    newLead: d.newLead ?? 0, reengaged: d.reengaged ?? 0, lost: d.lost ?? 0,
                    siteVisitDone: d.siteVisitDone ?? 0, siteVisitSchedule: d.siteVisitSchedule ?? 0,
                    prospect: d.prospect ?? 0, followUps: d.followUps ?? 0,
                });
            } else if (preSalesRes) {
                errors.push(`Pre-Sales: ${preSalesRes.status}`);
            }
            
            if (execsRes?.ok) {
                const json = await execsRes.json();
                const list = json.data || json;
                if (Array.isArray(list)) setExecutives(list);
            } else if (execsRes) {
                errors.push(`Executives: ${execsRes.status}`);
            }

            if (marketingRes?.ok) {
                const json = await marketingRes.json();
                setMarketingData(json.data || json || []);
            } else if (marketingRes) {
                errors.push(`Marketing: ${marketingRes.status}`);
            }

            if (errors.length > 0) {
                setFetchError(`Sync Issues: ${errors.join(', ')}`);
            } else {
                setFetchError(null);
            }
        } catch (error: any) {
             console.error('[Dashboard] Unexpected Error:', error.message || error);
             setFetchError(prev => (prev || '') + `Global: ${error.message || 'Error'}; `);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getHeaders, organization, token]);

    const fetchSales = useCallback(async (startDate?: string, endDate?: string, executiveId?: string | null) => {
        if (!organization || !token) return;
        try {
            const headers = getHeaders();
            let url = `${API_BASE_URL}/api/dashboard/sales-summary?organization=${encodeURIComponent(organization)}`;
            if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
            if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
            if (executiveId) url += `&executiveId=${encodeURIComponent(executiveId)}`;
            const res = await fetchWithTimeout(url, { headers });
            if (res.ok) {
                const json = await res.json();
                const d = json.data || json;
                setSalesData({ siteVisitDone: d.siteVisitDone ?? 0, salesTaken: d.salesTaken ?? 0 });
            }
        } catch (e: any) { console.log('[Dashboard] sales fetch error:', e.message || e); }
    }, [getHeaders, organization, token]);

    const fetchPreSales = useCallback(async (startDate?: string, endDate?: string, executiveId?: string | null) => {
        if (!organization || !token) return;
        try {
            const headers = getHeaders();
            let url = `${API_BASE_URL}/api/dashboard/presales-summary?organization=${encodeURIComponent(organization)}`;
            if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
            if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
            if (executiveId) url += `&executiveId=${encodeURIComponent(executiveId)}`;
            const res = await fetchWithTimeout(url, { headers });
            if (res.ok) {
                const json = await res.json();
                const d = json.data || json;
                setPreSalesData({
                    newLead: d.newLead ?? 0, reengaged: d.reengaged ?? 0, lost: d.lost ?? 0,
                    siteVisitDone: d.siteVisitDone ?? 0, siteVisitSchedule: d.siteVisitSchedule ?? 0,
                    prospect: d.prospect ?? 0, followUps: d.followUps ?? 0,
                });
            }
        } catch (e: any) { console.log('[Dashboard] presales fetch error:', e.message || e); }
    }, [getHeaders, organization, token]);

    const fetchMarketing = useCallback(async (startDate?: string, endDate?: string, categoryId?: string | null) => {
        if (!organization || !token) return;
        try {
            const headers = getHeaders();
            let url = `${API_BASE_URL}/api/dashboard/marketing-summary?organization=${encodeURIComponent(organization)}`;
            if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
            if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
            if (categoryId) url += `&campaignCategory=${encodeURIComponent(categoryId)}`;
            const res = await fetchWithTimeout(url, { headers });
            if (res.ok) {
                const json = await res.json();
                setMarketingData(json.data || []);
            }
        } catch (e: any) { console.log('[Dashboard] marketing fetch error:', e.message || e); }
    }, [getHeaders, organization, token]);

    useEffect(() => { 
        if (organization && token) fetchDashboardData(); 
    }, [fetchDashboardData, organization, token]);

    // ── Chart Data ──────────────────────────────────────────────────────────────
    const salesChartData: PieDataItem[] = [
        { label: 'Site Visit Done', value: salesData.siteVisitDone, color: SALES_COLORS.siteVisitDone },
        { label: 'Sales Taken', value: salesData.salesTaken, color: SALES_COLORS.salesTaken },
    ];
    const salesDetailItems = [
        { label: 'Site Visit Done', value: salesData.siteVisitDone, color: SALES_COLORS.siteVisitDone },
        { label: 'Sales Taken', value: salesData.salesTaken, color: SALES_COLORS.salesTaken },
    ];

    const preSalesChartData: PieDataItem[] = [
        { label: 'New Lead', value: preSalesData.newLead, color: PRESALES_COLORS.newLead },
        { label: 'Reengaged', value: preSalesData.reengaged, color: PRESALES_COLORS.reengaged },
        { label: 'Lost', value: preSalesData.lost, color: PRESALES_COLORS.lost },
        { label: 'Site Visit Done', value: preSalesData.siteVisitDone, color: PRESALES_COLORS.siteVisitDone },
        { label: 'SV Schedule', value: preSalesData.siteVisitSchedule, color: PRESALES_COLORS.siteVisitSchedule },
        { label: 'Prospect', value: preSalesData.prospect, color: PRESALES_COLORS.prospect },
        { label: 'Follow Ups', value: preSalesData.followUps, color: PRESALES_COLORS.followUps },
    ];
    const preSalesDetailItems = [...preSalesChartData];

    const marketingChartData: PieDataItem[] = marketingData;
    const marketingDetailItems = [...marketingData];

    const salesExecs = executives.filter(e => e.department === 'sales');
    const preSalesExecs = executives.filter(e => e.department === 'pre-sales');

    const campaignCategories = [
        { id: 'online', name: 'Source', department: 'Campaign' },
        { id: 'offline', name: 'Offline', department: 'Campaign' },
        { id: 'channel partner', name: 'Channel Partner', department: 'Campaign' }
    ];

    // ── Render ───────────────────────────────────────────────────────────────────
    if (!isAdmin) {
        return (
            <ScreenWrapper title="Master Dashboard">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg, padding: 32 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 }}>Access Restricted</Text>
                    <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
                        This dashboard is only available for Admin and Manager roles.
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (loading && organization && token) {
        return (
            <ScreenWrapper title="Master Dashboard">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 12 }}>Loading dashboard…</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Master Dashboard" headerRight={ 
            refreshing ? (
                <ActivityIndicator size="small" color={theme.accent} />
            ) : (
                <Pressable onPress={() => { setRefreshing(true); fetchDashboardData(); }} style={{ padding: 6 }}>
                    <RefreshCw size={18} color={theme.text} />
                </Pressable>
            )
        }>
            <ScrollView style={{ flex: 1, backgroundColor: theme.bg }}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}>

                {/* Debug Info: Always visible during testing to identify why data is zero 
                <View style={{ marginBottom: 16, padding: 12, backgroundColor: theme.cardBg, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: theme.accent, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
                        Server: <Text style={{ color: theme.text, fontWeight: 'bold' }}>{API_BASE_URL}</Text>
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
                        Session Org: <Text style={{ color: theme.text, fontWeight: 'bold' }}>{organization || 'N/A'}</Text>
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                        Auth Status: <Text style={{ color: token ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>{token ? 'Authenticated' : 'No Token'}</Text>
                    </Text>
                    {fetchError && (
                        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
                            <Text style={{ fontSize: 12, color: '#f44336' }}>Error Details: {fetchError}</Text>
                        </View>
                    )}
                </View>*/}

                {/* Stat Cards */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <StatCard label="ALL LEADS" value={stats.allLeads} theme={theme} color={theme.text} bgColor={theme.cardBg} />
                    <StatCard label="REENGAGED LEADS" value={stats.reengagedLeads} theme={theme} color={theme.text} bgColor={theme.cardBg} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <StatCard label="NEW ENQUIRIES" value={stats.newEnquiries} theme={theme} color={theme.text} bgColor={theme.cardBg} />
                    <StatCard label="ACTIVE PROSPECTS" value={stats.activeProspects} theme={theme} color={theme.text} bgColor={theme.cardBg} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <StatCard label="MISSED CALLS" value={stats.missedCalls} theme={theme} color={theme.text} bgColor={theme.cardBg} />
                    <StatCard label="MISSED FOLLOWUPS" value={stats.missedFollowups} theme={theme} color={theme.text} bgColor={theme.cardBg} />
                </View>

                {/* Total Sales */}
                <DashboardChartSection title="Sales Report" chartData={salesChartData} detailItems={salesDetailItems}
                    executives={salesExecs.length > 0 ? salesExecs : executives} theme={theme} isDark={isDark}
                    onDateChange={(s, e) => fetchSales(s, e)} onExecChange={(id) => fetchSales(undefined, undefined, id)} />

                {/* Total Pre Sales */}
                <DashboardChartSection title="Pre Sales Report" chartData={preSalesChartData} detailItems={preSalesDetailItems}
                    executives={preSalesExecs.length > 0 ? preSalesExecs : executives} theme={theme} isDark={isDark}
                    onDateChange={(s, e) => fetchPreSales(s, e)} onExecChange={(id) => fetchPreSales(undefined, undefined, id)} />

                {/* Marketing Report */}
                <DashboardChartSection title="Marketing Report" chartData={marketingChartData} detailItems={marketingDetailItems}
                    executives={campaignCategories} theme={theme} isDark={isDark}
                    defaultExecLabel="All Campaign" modalTitle="Select Campaign" searchPlaceholder="Search campaigns..." emptyText="No campaigns available" defaultRole="Campaign"
                    onDateChange={(s, e) => fetchMarketing(s, e)} onExecChange={(id) => fetchMarketing(undefined, undefined, id)} />

            </ScrollView>
        </ScreenWrapper>
    );
}
