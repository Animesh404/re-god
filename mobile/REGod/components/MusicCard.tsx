import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MusicCardProps {
  title: string;
  mediaUrl?: string;
  onPlay?: () => void;
  style?: any;
}

export default function MusicCard({ title, mediaUrl, onPlay, style }: MusicCardProps) {
  return (
    <View style={[styles.musicCard, style]}>
      <View style={styles.musicContent}>
        <Text style={styles.musicTitle}>{title}</Text>
        {mediaUrl && (
          <TouchableOpacity style={styles.playButton} onPress={onPlay}>
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  musicCard: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  musicContent: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
});
