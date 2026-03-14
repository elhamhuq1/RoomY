import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { colors } from '@/lib/theme/colors';
import { Avatar } from '@/components/ui/Avatar';
import type { GroceryItem } from '@/lib/types/database';

interface GroceryItemRowProps {
  item: GroceryItem;
  isChecked: boolean;
  creatorName: string;
  creatorId: string;
  creatorAvatarUrl?: string | null;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function RightSwipeAction({ onDelete }: { onDelete: () => void }) {
  return (
    <Pressable
      className="w-20 items-center justify-center bg-red-500 rounded-r-card"
      onPress={onDelete}
    >
      <Ionicons name="trash" size={22} color="#fff" />
      <Text className="mt-1 text-xs font-medium text-white">Delete</Text>
    </Pressable>
  );
}

export function GroceryItemRow({
  item,
  isChecked,
  creatorName,
  creatorId,
  creatorAvatarUrl,
  onToggle,
  onEdit,
  onDelete,
}: GroceryItemRowProps) {
  return (
    <ReanimatedSwipeable
      renderRightActions={(_progress, _translation, swipeableMethods) => (
        <RightSwipeAction
          onDelete={() => {
            swipeableMethods.close();
            onDelete();
          }}
        />
      )}
      overshootRight={false}
      rightThreshold={80}
    >
      <Pressable
        className={`flex-row items-center bg-neutral-bg px-4 py-3 ${
          isChecked ? 'opacity-60' : ''
        }`}
        onPress={onEdit}
      >
        {/* Circle checkbox */}
        <Pressable className="mr-3" onPress={onToggle} hitSlop={8}>
          <View
            className={`h-6 w-6 rounded-full items-center justify-center ${
              isChecked
                ? 'bg-brand'
                : 'border-2 border-neutral-tertiary'
            }`}
          >
            {isChecked && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
        </Pressable>

        {/* Item name */}
        <Text
          className={`flex-1 text-body ${
            isChecked
              ? 'text-neutral-tertiary line-through'
              : 'text-neutral-text'
          }`}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Quantity badge for checked items with qty > 1 */}
        {isChecked && item.quantity > 1 && (
          <Text className="font-sans mx-2 text-sm text-neutral-tertiary">
            x{item.quantity}
          </Text>
        )}

        {/* Creator avatar */}
        <Avatar userId={creatorId} name={creatorName} size="xs" avatarUrl={creatorAvatarUrl} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}
