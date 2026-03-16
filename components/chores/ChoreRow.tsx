import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';
import { Avatar } from '@/components/ui';
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
// Urgency color system
// ---------------------------------------------------------------------------

type UrgencyLevel = 'green' | 'yellow' | 'red';

function getUrgencyLevel(nextDueAt: string): UrgencyLevel {
  const due = new Date(nextDueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'red';       // overdue
  if (diffDays <= 1) return 'yellow';    // due today or tomorrow
  return 'green';                        // 2+ days out
}

const URGENCY_COLORS: Record<UrgencyLevel, { border: string; pillBg: string; pillText: string }> = {
  green:  { border: colors.brand.DEFAULT,   pillBg: 'bg-brand-light',  pillText: 'text-brand-dark' },
  yellow: { border: colors.semantic.warning, pillBg: 'bg-amber-50',     pillText: 'text-amber-700' },
  red:    { border: colors.semantic.error,   pillBg: 'bg-red-100',      pillText: 'text-red-700' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChoreRowProps {
  chore: Chore;
  assigneeName: string;
  assigneeId: string | null;
  assigneeAvatarUrl?: string | null;
  isMyChore: boolean;
  isDisputed: boolean;
  isDisputedByMe: boolean;
  disputeReason?: string | null;
  overdueDays: number | null;
  isCompleting: boolean;
  isClaiming: boolean;
  isDisputing: boolean;
  showDisputeButton: boolean;
  onComplete: () => void;
  onClaim: () => void;
  onDispute: () => void;
  onSwap: () => void;
  onDelete: () => void;
  onViewDispute?: () => void;
}

export function ChoreRow({
  chore,
  assigneeName,
  assigneeId,
  assigneeAvatarUrl,
  isMyChore,
  isDisputed,
  isDisputedByMe,
  disputeReason,
  overdueDays,
  isCompleting,
  isClaiming,
  isDisputing,
  showDisputeButton,
  onComplete,
  onClaim,
  onDispute,
  onSwap,
  onDelete,
  onViewDispute,
}: ChoreRowProps) {
  const emoji = getChoreEmoji(chore.name);
  const isOverdue = overdueDays !== null;

  // Row styling based on state — urgency coloring for non-disputed rows
  const urgency = getUrgencyLevel(chore.next_due_at);
  const urgencyStyle = URGENCY_COLORS[urgency];

  let rowBg = '';
  if (isDisputed) {
    rowBg = 'bg-red-50 border-l-4 border-red-300';
  } else {
    // Always show urgency left border for non-disputed rows
    rowBg = 'border-l-4';
  }

  return (
    <View
      className={`px-4 py-3 ${rowBg}`}
      style={!isDisputed ? { borderLeftColor: urgencyStyle.border } : undefined}
    >
      {/* Top row: avatar + name + action buttons */}
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="mr-3">
          <Avatar
            userId={assigneeId ?? ""}
            name={assigneeName}
            size="sm"
            avatarUrl={assigneeAvatarUrl}
          />
        </View>
        {/* Chore name + assignee */}
        <View className="flex-1">
          <Text className="text-card-title font-heading-semi text-neutral-text" numberOfLines={1}>
            {chore.name}
          </Text>
          <Text className="font-sans text-metadata text-neutral-secondary mt-0.5">
            {isMyChore ? 'You' : assigneeName}
          </Text>
        </View>

        {/* Action buttons */}
        <View className="flex-row items-center gap-1.5">
          {isMyChore && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
              onPress={onSwap}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#64748B" />
            </Pressable>
          )}
          {showDisputeButton && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-red-50 active:bg-red-100"
              onPress={onDispute}
              disabled={isDisputing}
            >
              {isDisputing ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="flag-outline" size={18} color="#EF4444" />
              )}
            </Pressable>
          )}
          {!isMyChore && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
              onPress={onClaim}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#64748B" />
              ) : (
                <Ionicons name="hand-left-outline" size={18} color="#64748B" />
              )}
            </Pressable>
          )}
          {isMyChore && (
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-brand-light active:bg-brand-light"
              onPress={onComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color={colors.brand.DEFAULT} />
              ) : (
                <Ionicons name="checkmark" size={20} color={colors.brand.DEFAULT} />
              )}
            </Pressable>
          )}
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 active:bg-red-100"
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
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
            <Text className="text-xs font-heading-semi text-red-600">Disputed</Text>
          </View>
        )}
        {chore.effort_points > 1 && (
          <View className="bg-amber-50 px-2 py-0.5 rounded-full">
            <Text className="text-xs font-medium text-amber-700">
              ⚡×{chore.effort_points}
            </Text>
          </View>
        )}
        <View className={`rounded-full px-2 py-0.5 ${urgencyStyle.pillBg}`}>
          <Text className={`text-xs font-heading-semi ${urgencyStyle.pillText}`}>
            {isOverdue ? `${overdueDays}d overdue` : formatDueDate(chore.next_due_at)}
          </Text>
        </View>
      </View>

      {isDisputed && (
        <Pressable
          className="mt-1.5 ml-13 flex-row items-center"
          onPress={onViewDispute}
          disabled={!onViewDispute}
        >
          <Text className="font-sans text-xs text-red-600 flex-1" numberOfLines={2}>
            {isDisputedByMe
              ? `Your completion was disputed${disputeReason ? `: "${disputeReason}"` : ''}`
              : `You disputed this${disputeReason ? `: "${disputeReason}"` : ''}`}
          </Text>
          {onViewDispute && (
            <View className="flex-row items-center ml-2">
              <Text className="text-xs font-heading-semi text-brand mr-0.5">
                View
              </Text>
              <Ionicons name="chevron-forward" size={12} color={colors.brand.DEFAULT} />
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}
