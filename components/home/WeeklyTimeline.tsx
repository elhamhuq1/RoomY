import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  parseISO,
  isSameDay,
} from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/lib/theme/colors';

interface TimelineChore {
  id: string;
  name: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  isCompleted: boolean;
}

interface WeeklyTimelineProps {
  chores: TimelineChore[];
  selectedDate: string | null;
}

type DayGroup = {
  dayLabel: string;
  dateString: string;
  items: TimelineChore[];
};

export function WeeklyTimeline({ chores, selectedDate }: WeeklyTimelineProps) {
  const dayGroups = useMemo(() => {
    // Upstream weekChores is already projected and week-filtered.
    // If a specific date is selected, narrow to that single day.
    const visible = selectedDate
      ? chores.filter((chore) =>
          isSameDay(parseISO(chore.dueDate), parseISO(selectedDate))
        )
      : chores;

    // Group by day
    const groups = new Map<string, TimelineChore[]>();
    for (const chore of visible) {
      const dateKey = format(parseISO(chore.dueDate), 'yyyy-MM-dd');
      const existing = groups.get(dateKey) ?? [];
      existing.push(chore);
      groups.set(dateKey, existing);
    }

    // Convert to sorted array of day groups
    const result: DayGroup[] = [];
    const sortedKeys = Array.from(groups.keys()).sort();
    for (const dateKey of sortedKeys) {
      result.push({
        dayLabel: format(parseISO(dateKey), 'EEEE').toUpperCase(),
        dateString: dateKey,
        items: groups.get(dateKey)!,
      });
    }

    return result;
  }, [chores, selectedDate]);

  const hasItems = dayGroups.some((g) => g.items.length > 0);

  return (
    <View className="mt-4 px-5 pb-8">
      <Text className="text-section-heading font-heading-semi text-neutral-text mb-3">
        This Week
      </Text>

      {!hasItems ? (
        <View className="items-center py-6">
          <Image
            source={require('@/docs/empty-state-images/chore-main-empty-state.png')}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
          <Text className="text-body text-neutral-secondary mt-3">
            No chores scheduled
          </Text>
        </View>
      ) : (
        <View className="ml-2">
          {dayGroups.map((group, groupIndex) => (
            <View key={group.dateString}>
              {/* Day header */}
              <Text className="text-overline text-neutral-secondary mb-2">
                {group.dayLabel}
              </Text>

              {group.items.map((item, itemIndex) => {
                const isLast =
                  groupIndex === dayGroups.length - 1 &&
                  itemIndex === group.items.length - 1;

                return (
                  <View
                    key={item.id}
                    className="flex-row mb-3"
                  >
                    {/* Timeline column */}
                    <View className="items-center mr-3" style={{ width: 16 }}>
                      {/* Dot */}
                      <View
                        className="rounded-full"
                        style={{
                          width: 10,
                          height: 10,
                          marginTop: 4,
                          backgroundColor: item.isCompleted
                            ? colors.brand.DEFAULT
                            : colors.neutral.border,
                        }}
                      />
                      {/* Connecting line */}
                      {!isLast && (
                        <View
                          className="flex-1"
                          style={{
                            width: 2,
                            backgroundColor: colors.neutral.border,
                            marginTop: 2,
                          }}
                        />
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 pb-1">
                      <Text className="text-card-title font-heading-semi text-neutral-text">
                        {item.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Avatar
                          userId={item.assigneeId}
                          name={item.assigneeName}
                          size="xs"
                        />
                        <Text className="text-metadata text-neutral-secondary ml-2">
                          {item.assigneeName}
                        </Text>
                        {item.isCompleted ? (
                          <View className="flex-row items-center ml-2">
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={colors.brand.DEFAULT}
                            />
                            <Text className="text-metadata text-brand ml-0.5">
                              Done
                            </Text>
                          </View>
                        ) : (
                          <Text className="text-metadata text-neutral-tertiary ml-2">
                            Pending
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
