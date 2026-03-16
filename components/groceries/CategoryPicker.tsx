import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';
import { DEPARTMENTS } from '@/lib/constants/grocery-departments';

interface CategoryPickerProps {
  visible: boolean;
  currentCategory: string;
  onSelect: (category: string) => void;
  onDismiss: () => void;
}

export function CategoryPicker({
  visible,
  currentCategory,
  onSelect,
  onDismiss,
}: CategoryPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        className="flex-1 items-center justify-end bg-black/40"
        onPress={onDismiss}
      >
        {/* Card — stop propagation so tapping inside doesn't dismiss */}
        <Pressable
          className="mx-4 mb-8 w-full max-w-sm rounded-2xl bg-white p-5"
          onPress={() => {}}
        >
          <Text className="mb-4 text-center text-lg font-heading text-neutral-text">
            Change Category
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 400 }}
          >
            <View className="flex-row flex-wrap justify-center gap-2">
              {DEPARTMENTS.map((dept) => {
                const isActive = dept.id === currentCategory;
                return (
                  <Pressable
                    key={dept.id}
                    className={`flex-row items-center rounded-xl px-3.5 py-2.5 ${
                      isActive
                        ? 'bg-brand'
                        : 'border border-neutral-border bg-neutral-bg active:bg-neutral-surface'
                    }`}
                    onPress={() => onSelect(dept.id)}
                  >
                    <Ionicons
                      name={dept.icon as any}
                      size={16}
                      color={isActive ? '#fff' : colors.neutral.secondary}
                    />
                    <Text
                      className={`ml-1.5 text-sm font-medium ${
                        isActive ? 'text-white' : 'text-neutral-text'
                      }`}
                    >
                      {dept.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
