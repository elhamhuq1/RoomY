import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/lib/theme/colors';

interface Member {
  user_id: string;
  display_name: string;
}

interface MembersCardProps {
  members: Member[];
  householdName: string;
  inviteCode: string;
}

export function MembersCard({ members, householdName, inviteCode }: MembersCardProps) {
  const [copied, setCopied] = useState(false);

  const formattedCode = inviteCode
    ? inviteCode.slice(0, 4) + ' ' + inviteCode.slice(4)
    : '';

  const isSolo = members.length <= 1;

  const handleCopyCode = useCallback(async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteCode]);

  const handleShare = useCallback(async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join my household on RoomY! Use code: ${inviteCode}`,
      });
    } catch {
      // User cancelled or share failed
    }
  }, [inviteCode]);

  return (
    <Card className="mx-5 mt-4">
      {/* Household name overline */}
      <Text className="text-overline text-neutral-secondary uppercase">
        {householdName}
      </Text>

      {/* Avatar row */}
      <View className="mt-3 flex-row items-start">
        {members.map((member) => (
          <View key={member.user_id} className="mr-3 items-center" style={{ maxWidth: 56 }}>
            <Avatar userId={member.user_id} name={member.display_name} size="md" />
            <Text
              className="text-metadata text-neutral-secondary mt-1"
              numberOfLines={1}
            >
              {member.display_name.split(' ')[0]}
            </Text>
          </View>
        ))}
      </View>

      {/* Invite section */}
      <View className={`mt-4 ${isSolo ? 'pt-3 border-t border-neutral-border' : 'pt-3 border-t border-neutral-border'}`}>
        {isSolo ? (
          /* Prominent invite for solo creator */
          <View className="items-center">
            <View className="flex-row items-center mb-2">
              <Ionicons name="people-outline" size={18} color={colors.brand.DEFAULT} />
              <Text className="text-body text-neutral-text font-semibold ml-2">
                Invite your roommates
              </Text>
            </View>
            <Text
              className="text-section-heading font-heading text-neutral-text tracking-widest my-2"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formattedCode}
            </Text>
            <View className="flex-row gap-3 mt-1">
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-full bg-brand py-2.5 px-4"
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text className="text-metadata text-white font-semibold">Share</Text>
              </Pressable>
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-full border-2 border-brand py-2.5 px-4"
                onPress={handleCopyCode}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color={colors.brand.DEFAULT}
                  style={{ marginRight: 6 }}
                />
                <Text className="text-metadata text-brand font-semibold">
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Compact invite for households with members */
          <View>
            <Text className="text-metadata text-neutral-secondary mb-2">Invite</Text>
            <View className="flex-row items-center bg-neutral-surface rounded-card px-3 py-2.5">
              <Text
                className="flex-1 text-body text-neutral-text tracking-wider"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formattedCode}
              </Text>
              <Pressable
                onPress={handleCopyCode}
                className="p-1.5 mr-1"
                hitSlop={8}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? colors.semantic.success : colors.neutral.secondary}
                />
              </Pressable>
              <Pressable
                onPress={handleShare}
                className="p-1.5"
                hitSlop={8}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={colors.neutral.secondary}
                />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}
