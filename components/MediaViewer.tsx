import React from 'react';
import { Modal, View, Pressable, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { isVideoUrl } from '../utils/media';

interface MediaViewerProps {
  mediaUrl: string | null;
  onClose: () => void;
}

export function MediaViewer({ mediaUrl, onClose }: MediaViewerProps) {
  if (!mediaUrl) {
    return null;
  }

  const isVideo = isVideoUrl(mediaUrl);
  const videoRef = React.useRef<Video>(null);

  return (
    <Modal
      visible={!!mediaUrl}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
        {isVideo ? (
          <Video
            ref={videoRef}
            style={styles.media}
            source={{ uri: mediaUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={true}
            onPlaybackStatusUpdate={status => {
                if (status.isLoaded && status.didJustFinish) {
                    videoRef.current?.replayAsync();
                }
            }}
          />
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.media}
            contentFit="contain"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
