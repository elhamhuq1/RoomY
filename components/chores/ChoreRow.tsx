import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Chore } from '@/lib/types/database';

// ---------------------------------------------------------------------------
// Emoji mapping
// ---------------------------------------------------------------------------

const CHORE_EMOJI_MAP: { keyword: string; emoji: string }[] = [
  { keyword: 'dishes', emoji: "\uD83C\uDF7D\uFE0F" },      // plate
  { keyword: 'trash', emoji: "\uD83D\uDDD1\uFE0F" },        // wastebasket
  { keyword: 'vacuum', emoji: "\uD83E\uDDF9" },              // broom
  { keyword: 'clean bathroom', emoji: "\uD83D\uDEBF" },      // shower
  { keyword: 'bathroom', emoji: "\uD83D\uDEBF" },            // shower
  { keyword: 'mop', emoji: "\uD83E\uDDF9" },                 // broom
  { keyword: 'wipe', emoji: "\u2728" },                       // sparkles
  { keyword: 'counters', emoji: "\u2728" },                   // sparkles
  { keyword: 'laundry', emoji: "\uD83D\uDC55" },             // shirt
  { keyword: 'cook', emoji: "\uD83C\uDF73" },                // cooking
];

const DEFAULT_EMOJI = "\uD83D\uDCCB"; // clipboard

export function getChoreEmoji(choreName: string): string {
  const lower = choreName.toLowerCase();
  for (const entry of CHORE_EMOJI_MAP) {
    if (lower.includes(entry.keyword)) {
      return entry.emoji;
    }
  }
  return DEFAULT_EMOJI;
}

// ---------------------------------------------------------------------------
// Helpers (display-only)
// ---------------------------------------------------------------------------

function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'custom': return 'Custom';
    default: return frequency;
  }
}

function formatDueDate(nextDueAt: string): string {
  const due = new Date(nextDueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays}d`;
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChoreRowProps {
  chore: Chore;
  assigneeName: string;
  assigneeId: string | null;
  isMyChore: boolean;
  isDisputed: boolean;
  isDisputedByMe: boolean;
  overdueDays: number | null;
  isCompleting: boolean;
  isClaiming: boolean;
  isDisputing: boolean;
  showDisputeButton: boolean;
  onComplete: () => void;
  onClaim: () => void;
  onDispute: () => void;
  onSwap: () => void;
}

export function ChoreRow({
  chore,
  assigneeName,
  assigneeId,
  isMyChore,
  isDisputed,
  isDisputedByMe,
  overdueDays,
  isCompleting,
  isClaiming,
  isDisputing,
  showDisputeButton,
  onComplete,
  onClaim,
  onDispute,
  onSwap,
}: ChoreRowProps) {
  const emoji = getChoreEmoji(chore.name);
  const isOverdue = overdueDays !== null;

  // Row styling based on state — no mx/my on disputed/overdue since rows sit inside a Card
  let rowBg = '';
  if (isDisputed) {
    rowBg = 'bg-red-50 border-l-4 border-red-300';
  } else if (isOverdue) {
    rowBg = 'bg-red-50/50';
  }

  return (
    <View className={`px-4 py-3 ${rowBg}`}>
      {/* Top row: emoji + name + action buttons */}
      <View className="flex-row items-center">
        {/* Emoji icon container */}
        <View
          className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${
            isDisputed ? 'bg-red-100' : 'bg-brand-light'
          }`}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </View>

        {/* Chore name + assignee */}
        <View className="flex-1">
          <Text className="text-card-title text-neutral-text" numberOfLines={1}>
            {chore.name}
          </Text>
          <Text className="text-metadata text-neutral-secondary mt-0.5">
            {isMyChore ? 'You' : assigneeName}
          </Text>
        </View>

        {/* Action buttons */}
        <View className="flex-row items-center gap-1.5">
          {isMyChore && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-purple-50 active:bg-purple-100"
              onPress={onSwap}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#9333ea" />
            </Pressable>
          )}
          {showDisputeButton && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-amber-50 active:bg-amber-100"
              onPress={onDispute}
              disabled={isDisputing}
            >
              {isDisputing ? (
                <ActivityIndicator size="small" color="#d97706" />
              ) : (
                <Ionicons name="flag-outline" size={18} color="#d97706" />
              )}
            </Pressable>
          )}
          {!isMyChore && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-blue-50 active:bg-blue-100"
              onPress={onClaim}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Ionicons name="hand-left-outline" size={18} color="#3b82f6" />
              )}
            </Pressable>
          )}
          {isMyChore && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-green-50 active:bg-green-100"
              onPress={onComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color="#22c55e" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#22c55e" />
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Bottom row: metadata pills */}
      <View className="mt-2 ml-13 flex-row items-center gap-2">
        <View className="bg-brand-light px-2 py-0.5 rounded-full">
          <Text className="text-xs font-medium text-brand-dark">
            {getFrequencyLabel(chore.frequency)}
          </Text>
        </View>
        {isDisputed && (
          <View className="rounded-full bg-red-100 px-2 py-0.5">
            <Text className="text-xs font-semibold text-red-600">Disputed</Text>
          </View>
        )}
        {isOverdue ? (
          <View className="rounded-full bg-red-100 px-2 py-0.5">
            <Text className="text-xs font-semibold text-red-600">
              {overdueDays}d overdue
            </Text>
          </View>
        ) : (
          <Text className="text-metadata text-neutral-tertiary">
            {formatDueDate(chore.next_due_at)}
          </Text>
        )}
      </View>

      {isDisputedByMe && (
        <Text className="mt-1.5 ml-13 text-xs text-amber-600">
          Your completion was disputed
        </Text>
      )}
    </View>
  );
}
