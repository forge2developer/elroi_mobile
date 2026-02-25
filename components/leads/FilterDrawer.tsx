import CustomBottomSheet from '@/components/ui/CustomBottomSheet';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarFold, Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

type FilterValues = {
    name: string;
    source: string;
    subSource: string;
    campaign: string;
    status: string;
    project: string;
    dateStart: string;
    dateEnd: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onApply: (values: FilterValues) => void;
    onReset: () => void;
    initialValues?: Partial<FilterValues>;
};

// ─── Filter Options Data ───────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'date', label: 'Date' },
    { id: 'source', label: 'Source' },
    { id: 'status', label: 'Status' },
    { id: 'project', label: 'Project' },
    { id: 'campaign', label: 'Campaign' },
];

const DATE_OPTIONS = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'last_6_months', label: 'Last 6 Months' },
    { id: 'last_1_year', label: 'Last 1 Year' },
    { id: 'custom', label: 'Custom Date Range' },
];

const SOURCE_OPTIONS = [
    'Facebook', 'Google', 'Instagram', 'Website', 'WhatsApp'
];

// Matching STATUS_COLORS keys
const STATUS_OPTIONS = [
    'New', 'Contacted', 'Qualified', 'Converted', 'Closed'
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getLocalYYYYMMDD = (d: Date = new Date()) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const TODAY = getLocalYYYYMMDD();
const TODAY_YEAR = new Date().getFullYear();

function CustomDatePicker({ theme, dateStart, dateEnd, onChangeStart, onChangeEnd, showCalendar, setShowCalendar }: any) {
    const [calMonth, setCalMonth] = useState<{ year: number; month: number }>(() => {
        const ref = showCalendar === 'end' && dateEnd ? dateEnd : (dateStart || TODAY);
        const d = new Date(ref);
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    const [pickerMode, setPickerMode] = useState<'calendar' | 'month' | 'year'>('calendar');

    // Reset picker mode when we swap which calendar is shown
    useEffect(() => { setPickerMode('calendar'); }, [showCalendar]);

    const isStart = showCalendar === 'start';
    const calKey = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-01`;

    // Generate years list: from (today - 20 years) up to current year, reversed
    const years = Array.from({ length: 21 }, (_, i) => TODAY_YEAR - i);

    const calTheme = {
        backgroundColor: theme.inputBg,
        calendarBackground: theme.inputBg,
        textSectionTitleColor: theme.textSecondary,
        selectedDayBackgroundColor: theme.accent,
        selectedDayTextColor: theme.checkColor,
        todayTextColor: theme.accent,
        dayTextColor: theme.text,
        textDisabledColor: theme.textSecondary,
        arrowColor: theme.accent,
        monthTextColor: theme.text,
        'stylesheet.calendar.header': {
            header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 10, paddingRight: 10 },
        },
    };

    const renderHeader = (date: any) => {
        const d = new Date(date);
        const m = d.getMonth();
        const y = d.getFullYear();
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 }}>
                <TouchableOpacity onPress={() => setPickerMode(pickerMode === 'month' ? 'calendar' : 'month')}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                        {MONTH_NAMES[m]} {pickerMode === 'month' ? '▲' : '▼'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPickerMode(pickerMode === 'year' ? 'calendar' : 'year')}>
                    <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 15 }}>
                        {y} {pickerMode === 'year' ? '▲' : '▼'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const markedDates = isStart
        ? (dateStart ? { [dateStart]: { selected: true, selectedColor: theme.accent, selectedTextColor: theme.checkColor } } : {})
        : {
            ...(dateStart ? { [dateStart]: { startingDay: true, color: theme.accent, textColor: theme.checkColor } } : {}),
            ...(dateEnd ? { [dateEnd]: { endingDay: true, color: theme.accent, textColor: theme.checkColor } } : {}),
        };

    return (
        <View style={{ paddingVertical: 8 }}>
            {/* START DATE */}
            {showCalendar === 'start' && (
                <View style={{ borderRadius: 10, borderWidth: 1, borderColor: theme.border, marginBottom: 8, overflow: 'hidden' }}>
                    {pickerMode === 'month' && (
                        <View style={{ flexWrap: 'wrap', flexDirection: 'row', padding: 8, backgroundColor: theme.inputBg }}>
                            {MONTH_NAMES.map((m, i) => (
                                <TouchableOpacity key={m} style={{ width: '25%', padding: 8, alignItems: 'center' }}
                                    onPress={() => { setCalMonth(prev => ({ ...prev, month: i })); setPickerMode('calendar'); }}>
                                    <Text style={{ color: calMonth.month === i ? theme.accent : theme.text, fontWeight: calMonth.month === i ? '700' : '400' }}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {pickerMode === 'year' && (
                        <ScrollView style={{ maxHeight: 180, backgroundColor: theme.inputBg }}>
                            {years.map(y => (
                                <TouchableOpacity key={y} style={{ padding: 10, alignItems: 'center' }}
                                    onPress={() => { setCalMonth(prev => ({ ...prev, year: y })); setPickerMode('calendar'); }}>
                                    <Text style={{ color: calMonth.year === y ? theme.accent : theme.text, fontWeight: calMonth.year === y ? '700' : '400', fontSize: 15 }}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    {pickerMode === 'calendar' && (
                        <Calendar
                            key={calKey}
                            current={calKey}
                            onDayPress={(day: any) => { onChangeStart(day.dateString); setShowCalendar(null); }}
                            markedDates={markedDates}
                            markingType="custom"
                            maxDate={TODAY}
                            renderHeader={renderHeader}
                            onMonthChange={(m: any) => setCalMonth({ year: m.year, month: m.month - 1 })}
                            theme={calTheme}
                            hideExtraDays
                        />
                    )}
                </View>
            )}
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>Start Date</Text>
            <TouchableOpacity
                style={{ height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.inputBg, borderColor: showCalendar === 'start' ? theme.accent : theme.border }}
                onPress={() => setShowCalendar(showCalendar === 'start' ? null : 'start')}
            >
                <Text style={{ color: dateStart ? theme.text : theme.textSecondary, fontSize: 14 }}>{dateStart || 'Select start date'}</Text>
                <CalendarFold size={18} color={theme.accent} />
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            {/* END DATE */}
            {showCalendar === 'end' && (
                <View style={{ borderRadius: 10, borderWidth: 1, borderColor: theme.border, marginBottom: 8, overflow: 'hidden' }}>
                    {pickerMode === 'month' && (
                        <View style={{ flexWrap: 'wrap', flexDirection: 'row', padding: 8, backgroundColor: theme.inputBg }}>
                            {MONTH_NAMES.map((m, i) => (
                                <TouchableOpacity key={m} style={{ width: '25%', padding: 8, alignItems: 'center' }}
                                    onPress={() => { setCalMonth(prev => ({ ...prev, month: i })); setPickerMode('calendar'); }}>
                                    <Text style={{ color: calMonth.month === i ? theme.accent : theme.text, fontWeight: calMonth.month === i ? '700' : '400' }}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {pickerMode === 'year' && (
                        <ScrollView style={{ maxHeight: 180, backgroundColor: theme.inputBg }}>
                            {years.map(y => (
                                <TouchableOpacity key={y} style={{ padding: 10, alignItems: 'center' }}
                                    onPress={() => { setCalMonth(prev => ({ ...prev, year: y })); setPickerMode('calendar'); }}>
                                    <Text style={{ color: calMonth.year === y ? theme.accent : theme.text, fontWeight: calMonth.year === y ? '700' : '400', fontSize: 15 }}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    {pickerMode === 'calendar' && (
                        <Calendar
                            key={calKey}
                            current={calKey}
                            onDayPress={(day: any) => { onChangeEnd(day.dateString); setShowCalendar(null); }}
                            markedDates={markedDates}
                            markingType="period"
                            maxDate={TODAY}
                            renderHeader={renderHeader}
                            onMonthChange={(m: any) => setCalMonth({ year: m.year, month: m.month - 1 })}
                            theme={calTheme}
                            hideExtraDays
                        />
                    )}
                </View>
            )}
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>End Date</Text>
            <TouchableOpacity
                style={{ height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.inputBg, borderColor: showCalendar === 'end' ? theme.accent : theme.border }}
                onPress={() => setShowCalendar(showCalendar === 'end' ? null : 'end')}
            >
                <Text style={{ color: dateEnd ? theme.text : theme.textSecondary, fontSize: 14 }}>{dateEnd || 'Select end date'}</Text>
                <CalendarFold size={18} color={theme.accent} />
            </TouchableOpacity>
        </View>
    );
}

export default function FilterDrawer({

    isOpen,
    onClose,
    onApply,
    onReset,
    initialValues,
}: Props) {
    const isDark = useColorScheme() === 'dark';
    const theme = getTheme(isDark);

    // ─── State ─────────────────────────────────────────────────────────────────
    const [activeCategory, setActiveCategory] = useState('date');
    const [dateOption, setDateOption] = useState<string>(''); // today, yesterday...
    const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);

    // Filter State
    const [filters, setFilters] = useState<FilterValues>({
        name: '', source: '', subSource: '', campaign: '', status: '', project: '', dateStart: '', dateEnd: ''
    });

    // Projects State
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // ─── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && initialValues) {
            setFilters(prev => ({ ...prev, ...initialValues }));
            // Try to deduce date option from values if possible, or just leave empty
        }
    }, [isOpen, initialValues]);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    // ─── API ───────────────────────────────────────────────────────────────────
    const fetchProjects = async () => {
        if (projects.length > 0) return; // Cache checks
        setLoadingProjects(true);
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');
            let organization = '';

            if (userStr) {
                const user = JSON.parse(userStr);
                organization = user.organization || user.org || '';
            }

            const url = `${API_BASE_URL}/api/projects?organization=${organization}`;
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();

            if (res.ok) {
                // Assuming data is array or { projects: [] }
                const list = Array.isArray(data) ? data : (data.projects || []);
                setProjects(list);
            }
        } catch (e) {
            console.error('Failed to fetch projects', e);
        } finally {
            setLoadingProjects(false);
        }
    };

    // ─── Handlers ──────────────────────────────────────────────────────────────
    const updateFilter = (key: keyof FilterValues, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDateSelect = (optionId: string) => {
        setDateOption(optionId);
        const today = new Date();
        let start = '';
        let end = '';

        const formatDate = getLocalYYYYMMDD;

        if (optionId === 'today') {
            start = end = formatDate(today);
        } else if (optionId === 'yesterday') {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            start = end = formatDate(y);
        } else if (optionId === 'last_week') {
            const d = new Date(today);
            d.setDate(d.getDate() - 7);
            start = formatDate(d);
            end = formatDate(today);
        } else if (optionId === 'last_month') {
            const d = new Date(today);
            d.setMonth(d.getMonth() - 1);
            start = formatDate(d);
            end = formatDate(today);
        } else if (optionId === 'last_3_months') {
            const d = new Date(today);
            d.setMonth(d.getMonth() - 3);
            start = formatDate(d);
            end = formatDate(today);
        } else if (optionId === 'last_6_months') {
            const d = new Date(today);
            d.setMonth(d.getMonth() - 6);
            start = formatDate(d);
            end = formatDate(today);
        } else if (optionId === 'last_1_year') {
            const d = new Date(today);
            d.setFullYear(d.getFullYear() - 1);
            start = formatDate(d);
            end = formatDate(today);
        }

        if (optionId !== 'custom') {
            setFilters(prev => ({ ...prev, dateStart: start, dateEnd: end }));
        } else {
            // Do NOT wipe out existing dateStart/dateEnd if user just selects 'custom' again
        }
    };

    const toggleSelection = (key: 'source' | 'status' | 'project', value: string) => {
        // Simple toggle for single selection or comma-separated for multi
        // Current requirement implies simple filtering, using single string for now or comma?
        // Let's assume single selection matches current filters type, 
        // OR better: if user clicks same, deselect. If clicks new, select (Radio behavior)
        // Re-reading usage: "make filter like this screen shot" -> Screenshot shows checkboxes/radials.
        // Let's implement multi-select logic joined by comma if the backend supports it,
        // otherwise single select. `leads.tsx` filter logic just does exact match usually. 
        // I will implement "Toggle" (add if missing, remove if present) but join with comma?
        // Actually for now let's stick to single select per field to be safe with backend,
        // unless user requested multi. Screenshot has checkboxes which implies multi.
        // I'll stick to single select for safety with existing `leads.tsx` logic unless I refactor that too.
        // Wait, screenshot shows checkboxes. I should support Checkbox UI but maybe just one active?
        // Let's support simple single select for now to avoid breaking backend filtering which expects string.

        const current = filters[key];
        // If already selected, deselect. Else select.
        if (current === value) {
            updateFilter(key, '');
        } else {
            updateFilter(key, value);
        }
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleResetLocal = () => {
        setDateOption('');
        onReset(); // Calls parent reset
        setFilters({ name: '', source: '', subSource: '', campaign: '', status: '', project: '', dateStart: '', dateEnd: '' });
    };

    // ─── Render Content ────────────────────────────────────────────────────────
    const renderContent = () => {
        switch (activeCategory) {
            case 'date':
                return (
                    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 120 }}>
                        {DATE_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                className="flex-row items-center mb-[18px] gap-3"
                                onPress={() => handleDateSelect(opt.id)}
                            >
                                <View className="w-5 h-5 rounded-full border-2 border-[#ccc] items-center justify-center" style={[dateOption === opt.id && { borderColor: theme.accent }]}>
                                    {dateOption === opt.id && <View className="w-2.5 h-2.5 rounded-full" style={[{ backgroundColor: theme.accent }]} />}
                                </View>
                                <Text className="text-[15px]" style={[{ color: theme.text }]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                        {dateOption === 'custom' && (
                            <CustomDatePicker
                                theme={theme}
                                dateStart={filters.dateStart}
                                dateEnd={filters.dateEnd}
                                onChangeStart={(d: string) => updateFilter('dateStart', d)}
                                onChangeEnd={(d: string) => updateFilter('dateEnd', d)}
                                showCalendar={showCalendar}
                                setShowCalendar={setShowCalendar}
                            />
                        )}
                    </ScrollView>
                );

            case 'source':
                return (
                    <ScrollView className="flex-1 p-4">
                        {SOURCE_OPTIONS.map(opt => (
                            <TouchableOpacity key={opt} className="flex-row items-center mb-[18px] gap-3" onPress={() => toggleSelection('source', opt)}>
                                <View className="w-5 h-5 rounded border-2 border-[#ccc] items-center justify-center" style={[filters.source === opt && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                    {filters.source === opt && <Check size={14} color={theme.checkColor} />}
                                </View>
                                <Text className="text-[15px]" style={[{ color: theme.text }]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                );

            case 'status':
                return (
                    <ScrollView className="flex-1 p-4">
                        {STATUS_OPTIONS.map(opt => (
                            <TouchableOpacity key={opt} className="flex-row items-center mb-[18px] gap-3" onPress={() => toggleSelection('status', opt)}>
                                <View className="w-5 h-5 rounded border-2 border-[#ccc] items-center justify-center" style={[filters.status === opt && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                    {filters.status === opt && <Check size={14} color={theme.checkColor} />}
                                </View>
                                <Text className="text-[15px]" style={[{ color: theme.text }]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                );

            case 'project':
                return (
                    <ScrollView className="flex-1 p-4">
                        {loadingProjects ? (
                            <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 20 }} />
                        ) : projects.length === 0 ? (
                            <Text style={{ padding: 16, color: theme.textSecondary }}>No projects found</Text>
                        ) : (
                            projects.map((proj: any, idx) => {
                                const pName = proj.project_name || proj.name || 'Unknown';
                                const isSelected = filters.project === pName;
                                return (
                                    <TouchableOpacity key={idx} className="flex-row items-center mb-[18px] gap-3" onPress={() => toggleSelection('project', pName)}>
                                        <View className="w-5 h-5 rounded border-2 border-[#ccc] items-center justify-center" style={[isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                            {isSelected && <Check size={14} color={theme.checkColor} />}
                                        </View>
                                        <Text className="text-[15px]" style={[{ color: theme.text }]}>{pName}</Text>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                );

            case 'campaign':
                return (
                    <View style={{ padding: 16 }}>
                        <Text className="text-xs font-semibold" style={[{ color: theme.textSecondary, marginBottom: 8 }]}>Campaign Name</Text>
                        <TextInput
                            className="h-11 border rounded-lg px-3"
                            style={[{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                            value={filters.campaign}
                            onChangeText={t => updateFilter('campaign', t)}
                            placeholder="Type campaign name..."
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>
                );



            default: return null;
        }
    };

    return (
        <CustomBottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Filter Leads"
            height="85%" // Taller for master-detail
            noPadding
        >
            <View className="flex-1" style={[{ backgroundColor: theme.bg }]}>
                <View className="flex-1 flex-row">
                    {/* Left Sidebar */}
                    <View className="w-[110px] border-r" style={[{ backgroundColor: theme.sidebarBg, borderRightColor: theme.border }]}>
                        {CATEGORIES.map(cat => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    className="py-4 px-2.5 justify-center"
                                    style={[isActive && { backgroundColor: theme.activeItemBg }]}
                                    onPress={() => setActiveCategory(cat.id)}
                                >
                                    {isActive && <View className="absolute left-0 top-0 bottom-0 w-[3px]" style={[{ backgroundColor: theme.accent }]} />}
                                    <Text className="text-[13px]" style={[
                                        { color: isActive ? theme.text : theme.textSecondary, fontWeight: isActive ? '600' : '400' }
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Right Content */}
                    <View className="flex-1">
                        <Text className="text-[13px] font-semibold p-4 uppercase tracking-wide" style={[{ color: theme.textSecondary }]}>
                            {CATEGORIES.find(c => c.id === activeCategory)?.label}
                        </Text>
                        <View className="h-[1px] w-full" style={[{ backgroundColor: theme.border }]} />
                        {renderContent()}
                    </View>
                </View>

                {/* Footer */}
                <View className="flex-row gap-3 p-4 border-t" style={[{ borderTopColor: theme.border }]}>
                    <Pressable
                        className="flex-1 h-12 rounded-lg justify-center items-center"
                        style={[{ backgroundColor: theme.btnSecondaryBg }]}
                        onPress={handleResetLocal}
                    >
                        <Text className='text-white font-bold text-xl'>Reset</Text>
                    </Pressable>
                    <Pressable
                        className="flex-1 h-12 rounded-lg justify-center items-center"
                        style={[{ backgroundColor: theme.btnPrimaryBg, flex: 2 }]}
                        onPress={handleApply}
                    >
                        <Text style={{ color: theme.textfont }} className='font-bold text-xl'>Apply Filters</Text>
                    </Pressable>
                </View>
            </View>
        </CustomBottomSheet>
    );
}

// ─── Theme ─────────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
    return {
        bg: isDark ? '#161616' : '#ffffff',
        sidebarBg: isDark ? '#0f0f0f' : '#f8f9fa',
        activeItemBg: isDark ? '#1f1f1f' : '#ffffff',
        border: isDark ? '#2a2a2a' : '#e5e7eb',
        text: isDark ? '#e5e5e5' : '#1a1a1a',
        textSecondary: isDark ? '#888888' : '#6b7280',
        accent: isDark ? '#ffffff' : '#000000',
        checkColor: isDark ? '#000000' : '#ffffff',
        inputBg: isDark ? '#1f1f1f' : '#ffffff',
        btnPrimaryBg: isDark ? '#D0D0D0' : '#332F2C',
        btnPrimaryText: '#ffffff',
        btnSecondaryBg: isDark ? '#A24446' : '#E91923',
        btnSecondaryText: isDark ? '#cccccc' : '#374151',
        textfont: isDark ? '#1a1a1a' : '#ffffffff',
    };
}
