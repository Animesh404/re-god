import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LessonScreen() {

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Image */}
        <Image 
          source={require('@/assets/images/Course Title Photo - The God You Can Love-toni-minikus.jpg')} // Replace with actual chapter image
          style={styles.headerImage}
        />
        
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>Inventor of the Roundabout</Text>

          {/* Key Verses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key verses</Text>
            {/* ... content for key verses */}
          </View>

          {/* Lesson Study */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lesson study</Text>
            {/* ... content for lesson study */}
          </View>

          {/* Response Unlock */}
          <View style={styles.unlockSection}>
            <Ionicons name="lock-closed" size={32} color="gray" />
            <Text style={styles.unlockText}>Respond to unlock the next lesson</Text>
            <TouchableOpacity style={styles.responseButton}>
              <Text style={styles.responseButtonText}>Response</Text>
            </TouchableOpacity>
          </View>

          {/* Music Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Music selection</Text>
            {/* ... content for music selection */}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Further study</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Personal Experiences</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Resources</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Artwork</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F4',
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  unlockSection: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  unlockText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginVertical: 10,
  },
  responseButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  responseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
