import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { pickAndUploadAvatar, removeAvatar } from '@/lib/avatar-upload';

interface AvatarUploadProps {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: 'md' | '2xl';
  showBadgeAlways?: boolean;
  onUploadComplete: (url: string | null) => void;
  onError: (message: string) => void;
}

export function AvatarUpload({
  userId,
  name,
  avatarUrl,
  size = 'md',
  showBadgeAlways = false,
  onUploadComplete,
  onError,
}: AvatarUploadProps) {
  const showBadge = showBadgeAlways || !avatarUrl;

  async function handleCamera() {
    try {
      const url = await pickAndUploadAvatar(userId, 'camera');
      if (url) onUploadComplete(url);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown error';
      if (message === 'CAMERA_PERMISSION_DENIED') {
        onError('Camera access is needed to take a profile photo.');
        return;
      }
      Alert.alert('Upload Failed', 'Failed to upload photo.', [
        { text: 'Try Again', onPress: () => handleCamera() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  async function handleGallery() {
    try {
      const url = await pickAndUploadAvatar(userId, 'gallery');
      if (url) onUploadComplete(url);
    } catch {
      Alert.alert('Upload Failed', 'Failed to upload photo.', [
        { text: 'Try Again', onPress: () => handleGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  function handleRemove() {
    Alert.alert(
      'Remove profile photo?',
      'Your avatar will return to initials.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAvatar(userId);
              onUploadComplete(null);
            } catch {
              onError('Failed to remove photo. Please try again.');
            }
          },
        },
      ]
    );
  }

  function showActionSheet() {
    if (avatarUrl) {
      Alert.alert('Profile Photo', undefined, [
        { text: 'Take Photo', onPress: handleCamera },
        { text: 'Choose from Library', onPress: handleGallery },
        { text: 'Remove Photo', style: 'destructive', onPress: handleRemove },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Profile Photo', undefined, [
        { text: 'Take Photo', onPress: handleCamera },
        { text: 'Choose from Library', onPress: handleGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  return (
    <Pressable onPress={showActionSheet}>
      <View>
        <Avatar userId={userId} name={name} size={size} avatarUrl={avatarUrl} />
        {showBadge && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#2D6A4F',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
