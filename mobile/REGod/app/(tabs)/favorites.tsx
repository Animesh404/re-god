import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Interfaces for data types
interface FavoriteLesson {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
}

interface FavoriteMusic {
  id: string;
  title: string;
  artist: string;
}

// Placeholder data
const favoriteLessons: FavoriteLesson[] = [
  { id: '1', title: 'Forgiving', subtitle: 'Inventor of the Roundabout', image: require('@/assets/images/Forgiving-holly-mandarich-wZSFbidc640-unsplash.jpg') },
  { id: '2', title: 'Just / Fair', subtitle: 'Lesson Title', image: require('@/assets/images/JustFair-toni-minikus.jpg') },
  { id: '3', title: 'Chapter Title', subtitle: 'Lesson Title', image: require('@/assets/images/Humble-toni-minikus.jpg') },
  { id: '4', title: 'Chapter Title', subtitle: 'Lesson Title', image: require('@/assets/images/Patient-toni-minikus.jpg') },
  { id: '5', title: 'Chapter Title', subtitle: 'Lesson Title', image: require('@/assets/images/Powerful-toni-minikus.jpg') },
  { id: '6', title: 'Chapter Title', subtitle: 'Lesson Title', image: require('@/assets/images/Relational-tim-mossholder-H8_EKl5TgbM-unsplash.jpg') },
];

const favoriteMusic: FavoriteMusic[] = [
  { id: '1', title: 'Things We Leave Behind', artist: 'Michael Card' },
  { id: '2', title: 'Title of the Song', artist: 'Musician' },
];

export default function FavoritesScreen() {
  const renderLessonItem = ({ item }: { item: FavoriteLesson }) => (
    <TouchableOpacity style={styles.lessonItem}>
      <Image source={item.image} style={styles.lessonImage} />
      <View style={styles.lessonTextContainer}>
        <Text style={styles.lessonTitle}>{item.title}</Text>
        <Text style={styles.lessonSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="gray" />
    </TouchableOpacity>
  );

  const renderMusicItem = ({ item }: { item: FavoriteMusic }) => (
    <View style={styles.musicCard}>
      <View style={styles.musicTitleContainer}>
        <Text style={styles.musicTitle}>{item.title}</Text>
        <Ionicons name="heart" size={18} color="white" />
      </View>
      <Text style={styles.musicArtist}>{item.artist}</Text>
      <TouchableOpacity style={styles.musicButton}>
        <Ionicons name="musical-notes" size={16} color="white" />
        <Text style={styles.musicButtonText}>Music</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Lessons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lessons</Text>
          <FlatList
            data={favoriteLessons}
            renderItem={renderLessonItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Music Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.musicList}>
            {favoriteMusic.map(item => <View key={item.id}>{renderMusicItem({ item })}</View>)}
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lessonImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  lessonTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lessonSubtitle: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  musicList: {
    paddingRight: 20,
  },
  musicCard: {
    backgroundColor: '#6B8E23',
    borderRadius: 10,
    padding: 15,
    width: 200,
    marginRight: 15,
  },
  musicTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  musicTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  musicArtist: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 15,
  },
  musicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  musicButtonText: {
    color: 'white',
    marginLeft: 8,
  },
});
