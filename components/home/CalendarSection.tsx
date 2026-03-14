import { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { colors } from "@/lib/theme/colors";
import {
  buildMarkedDates,
  EXPENSE_DOT,
  CHORE_DOT,
} from "@/lib/calendar-utils";
import type { Expense, Chore } from "@/lib/types/database";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CalendarSectionProps = {
  expenses: Expense[];
  chores: Chore[];
  selectedDate: string;
  onDateChange: (date: string) => void;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export default function CalendarSection({
  expenses,
  chores,
  selectedDate,
  onDateChange,
}: CalendarSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Build marked dates for the current month (used in both views)
  const markedDates = useMemo(() => {
    const marks = buildMarkedDates(expenses, chores, currentMonth);
    // Add selected date highlight
    if (!marks[selectedDate]) {
      marks[selectedDate] = { dots: [] };
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: colors.brand.DEFAULT,
    };
    return marks;
  }, [expenses, chores, currentMonth, selectedDate]);

  // Build the 7 days of the week containing the selected date
  const weekDays = useMemo(() => {
    const selected = parseISO(selectedDate);
    const weekStart = startOfWeek(selected, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dateString = format(day, "yyyy-MM-dd");
      return {
        date: day,
        dateString,
        dayOfMonth: format(day, "d"),
        isToday: isToday(day),
        isSelected: isSameDay(day, selected),
        dots: markedDates[dateString]?.dots ?? [],
      };
    });
  }, [selectedDate, markedDates]);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const handleDayPress = useCallback(
    (dateString: string) => {
      onDateChange(dateString);
    },
    [onDateChange]
  );

  const handleCalendarDayPress = useCallback(
    (day: DateData) => {
      onDateChange(day.dateString);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(false);
    },
    [onDateChange]
  );

  const handleMonthChange = useCallback((month: DateData) => {
    setCurrentMonth(new Date(month.year, month.month - 1, 1));
  }, []);

  // Month/year label for the header
  const monthLabel = format(
    expanded ? currentMonth : parseISO(selectedDate),
    "MMMM yyyy"
  );

  return (
    <View>
      {/* Header with month label and expand/collapse toggle */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-neutral-text">
          {monthLabel}
        </Text>
        <Pressable
          onPress={toggleExpanded}
          className="rounded-full p-1 active:bg-neutral-surface"
          hitSlop={8}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.neutral.secondary}
          />
        </Pressable>
      </View>

      {/* Calendar content */}
      <View className="overflow-hidden rounded-card bg-transparent border border-neutral-border">
        {expanded ? (
          // Full month calendar view
          <Calendar
            current={format(currentMonth, "yyyy-MM-dd")}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={handleCalendarDayPress}
            onMonthChange={handleMonthChange}
            enableSwipeMonths={true}
            theme={{
              calendarBackground: colors.neutral.bg,
              todayTextColor: colors.brand.DEFAULT,
              selectedDayBackgroundColor: colors.brand.DEFAULT,
              selectedDayTextColor: "#ffffff",
              arrowColor: colors.brand.DEFAULT,
              dotStyle: { marginTop: 2 },
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />
        ) : (
          // Week strip view
          <View className="px-2 py-3">
            <View className="flex-row justify-around">
              {weekDays.map((day, index) => (
                <Pressable
                  key={day.dateString}
                  onPress={() => handleDayPress(day.dateString)}
                  className="items-center"
                  style={{ flex: 1 }}
                >
                  {/* Day label */}
                  <Text className="text-xs text-neutral-secondary">
                    {DAY_LABELS[index]}
                  </Text>

                  {/* Date number with highlight */}
                  <View
                    className={`mt-1 h-9 w-9 items-center justify-center rounded-full ${
                      day.isSelected
                        ? "bg-brand"
                        : day.isToday
                          ? "bg-brand-light"
                          : ""
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        day.isSelected
                          ? "text-white"
                          : day.isToday
                            ? "text-brand-dark"
                            : "text-neutral-text"
                      }`}
                    >
                      {day.dayOfMonth}
                    </Text>
                  </View>

                  {/* Event dots */}
                  <View className="mt-1 h-2 flex-row items-center justify-center gap-1">
                    {day.dots.map((dot) => (
                      <View
                        key={dot.key}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: dot.color }}
                      />
                    ))}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Color legend */}
      <View className="mt-3 flex-row items-center justify-center gap-6">
        <View className="flex-row items-center">
          <View
            className="mr-2 h-3 w-3 rounded-full"
            style={{ backgroundColor: CHORE_DOT.color }}
          />
          <Text className="text-xs text-neutral-secondary">Chores</Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="mr-2 h-3 w-3 rounded-full"
            style={{ backgroundColor: EXPENSE_DOT.color }}
          />
          <Text className="text-xs text-neutral-secondary">Expenses</Text>
        </View>
      </View>
    </View>
  );
}
