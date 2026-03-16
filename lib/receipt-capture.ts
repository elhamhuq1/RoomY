import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface CapturedReceipt {
  base64: string;
  mimeType: string;
}

/**
 * Capture or pick a receipt photo, resize to 1200px width for OCR readability,
 * and return as base64-encoded JPEG for the scan-receipt Edge Function.
 *
 * @returns The base64 image data and mime type, or null if the user cancelled.
 * @throws Error with message 'CAMERA_PERMISSION_DENIED' if camera access denied.
 */
export async function captureReceiptImage(
  source: 'camera' | 'gallery'
): Promise<CapturedReceipt | null> {
  // Request camera permission if needed
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      throw new Error('CAMERA_PERMISSION_DENIED');
    }
  }

  // Launch camera or gallery
  const launcher =
    source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) return null;

  const image = result.assets[0];

  // Resize to 1200px width for OCR — aspect ratio preserved automatically
  // when only width is specified
  const manipulated = await manipulateAsync(
    image.uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: SaveFormat.JPEG, base64: true }
  );

  return {
    base64: manipulated.base64!,
    mimeType: 'image/jpeg',
  };
}
