import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

type PickSource = 'camera' | 'gallery';

/**
 * Pick or capture an image, resize to max 512x512, upload to Supabase Storage,
 * and update the user's profile with the new avatar URL.
 *
 * @returns The public avatar URL with cache buster, or null if cancelled.
 * @throws Error with code 'CAMERA_PERMISSION_DENIED' if camera access denied.
 */
export async function pickAndUploadAvatar(
  userId: string,
  source: PickSource
): Promise<string | null> {
  // Request camera permission if needed
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      throw new Error('CAMERA_PERMISSION_DENIED');
    }
  }

  // Pick or capture image
  const launcher =
    source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: 0.8,
  });

  if (result.canceled) return null;

  const image = result.assets[0];

  // Resize to max 512x512 if needed (image is already square-cropped)
  let finalUri = image.uri;
  let fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';

  if (image.width > 512 || image.height > 512) {
    const manipulated = await manipulateAsync(
      image.uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );
    finalUri = manipulated.uri;
    fileExt = 'jpeg'; // manipulator outputs JPEG
  }

  // Convert to ArrayBuffer for upload
  const arraybuffer = await fetch(finalUri).then((res) => res.arrayBuffer());

  // Upload to Supabase Storage (upsert overwrites previous)
  const filePath = `${userId}/avatar.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, arraybuffer, {
      contentType: image.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Get public URL with cache-busting timestamp
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return avatarUrl;
}

/**
 * Remove the user's avatar from storage and clear avatar_url in profile.
 */
export async function removeAvatar(userId: string): Promise<void> {
  // List files in user's folder to find the avatar file
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(filePaths);
  }

  // Clear avatar_url in profile
  await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);
}
