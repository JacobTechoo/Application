import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { isImageUrl, isVideoUrl, cleanMediaUrl } from '../utils/media';

interface MediaPreviewProps {
  mediaUrls: string[];
  onMediaPress: (url: string) => void;
}

export function MediaPreview({ mediaUrls, onMediaPress }: MediaPreviewProps) {
  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Attachments:</Text>
      <View style={styles.grid}>
        {mediaUrls.map((url, idx) => {
          const cleanUrl = cleanMediaUrl(url);
          if (!cleanUrl) return null;

          const isImage = isImageUrl(cleanUrl);
          const isVideo = isVideoUrl(cleanUrl);

          if (!isImage && !isVideo) {
            return null;
          }

          return (
            <Pressable key={idx} onPress={() => onMediaPress(cleanUrl)}>
              <View style={styles.mediaContainer}>
                {isImage ? (
                  <Image
                    source={{ uri: cleanUrl }}
                    style={styles.media}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.videoContainer}>
                    <Video
                      source={{ uri: cleanUrl }}
                      style={styles.media}
                      resizeMode={ResizeMode.COVER}
                      isMuted
                      shouldPlay={false}
                    />
                    <View style={styles.playIconContainer}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playIcon: {
    color: 'white',
    fontSize: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
