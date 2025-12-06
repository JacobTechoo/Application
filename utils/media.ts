import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabaseClient';
import { Platform } from 'react-native';

// Decide which bucket to use based on MIME type
export function getBucketForFile(mimeType: string | undefined): string {
  if (!mimeType) return 'Media_files'; // fallback
  if (mimeType.startsWith('image/')) return 'Pictures';
  if (mimeType.startsWith('video/')) return 'Media_files';
  return 'Media_files';
}

// Upload a single file to Supabase storage
export async function uploadMediaFile(
  asset: any,
  userId: string
): Promise<string> {
  // Get MIME type
  const mimeType: string =
    asset.mimeType || asset.type || 'image/jpeg';

  const bucket = getBucketForFile(mimeType);

  // Generate filename
  const extFromName =
    asset.fileName?.split('.').pop() ||
    mimeType.split('/')[1] ||
    'jpg';

  const fileName = `${userId}-${Date.now()}.${extFromName}`;
  const filePath = `${userId}/${fileName}`;

  try {
    let base64Data: string;

    if (Platform.OS === 'web') {
      // On web, asset.uri is a blob URL. We fetch it and read as base64.
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // reader.result is "data:image/jpeg;base64,...."
            // We just want the base64 part
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error("Failed to read file as base64 string"));
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
    } else {
      // On mobile, we use the file system API
      console.log('Reading file from URI:', asset.uri);
      base64Data = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });
    }

    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    console.log('Uploading file to Supabase:', filePath, 'Size:', binaryData.length);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, binaryData, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    console.log('Uploaded media URL:', data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error('File upload failed:', err);
    throw err;
  }
}

// Check if URL is a supported media type
export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|avi|mkv|webm|mp3|m4v|3gp)$/i.test(url);
}

// Clean and validate media URL
export function cleanMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.trim();
}
