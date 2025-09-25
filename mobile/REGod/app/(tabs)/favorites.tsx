import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LessonIndexModal from '@/components/LessonIndexModal';
import MusicCard from '@/components/MusicCard';
import ApiService, { type Module, type Chapter } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

// Default placeholder image for fallback
const defaultChapterImage = require('@/assets/images/logo.png');

// Helper function to convert relative URLs to full URLs
const getImageUrl = (imageUrl: string | null): any => {
  if (!imageUrl) return defaultChapterImage;
  if (imageUrl.startsWith('http')) return { uri: imageUrl };
  return { uri: `https://bf5773da486c.ngrok-free.app${imageUrl}` };
};

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
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [favoritedChapters, setFavoritedChapters] = useState<any[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteMusic, setFavoriteMusic] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadFavoritedChapters();
      loadFavoriteMusic();
    }
  }, [isAuthenticated, authLoading]);

  const loadFavoritedChapters = async () => {
    try {
      setLoading(true);
      const favoritedChaptersData = await ApiService.getChapterFavorites();
      setFavoritedChapters(favoritedChaptersData);
    } catch (error) {
      console.error('Error loading favorited chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteMusic = async () => {
    try {
      // Get all favorited chapters
      const favoritedChaptersData = await ApiService.getChapterFavorites();
      const musicItems: any[] = [];

      // For each favorited chapter, get its modules and extract music
      for (const chapter of favoritedChaptersData) {
        try {
          // Use course_id if available, otherwise skip this chapter
          const courseId = (chapter as any).course_id;
          if (!courseId) {
            console.warn(`Chapter ${chapter.chapter_id} missing course_id, skipping music extraction`);
            continue;
          }
          
          const modules = await ApiService.getCourseModules(courseId);
          const musicModules = modules.filter(module => module.music_selection);
          
          musicModules.forEach(module => {
            musicItems.push({
              id: `${chapter.chapter_id}-${module.id}`,
              title: module.music_selection,
              mediaUrl: module.media_url,
              chapterTitle: chapter.chapter_title,
              courseTitle: chapter.course_title,
              moduleId: module.id,
              courseId: courseId
            });
          });
        } catch (error) {
          console.error(`Error loading modules for chapter ${chapter.chapter_id}:`, error);
        }
      }

      setFavoriteMusic(musicItems);
    } catch (error) {
      console.error('Error loading favorite music:', error);
    }
  };

  const handleChapterPress = async (chapter: any) => {
    try {
      // Load modules for this chapter
      const courseModules = await ApiService.getCourseModules(chapter.course_id);
      setModules(courseModules);
      setSelectedChapter(chapter);
      setShowLessonModal(true);
    } catch (error) {
      console.error('Error loading chapter modules:', error);
    }
  };

  const handleModulePress = (module: Module) => {
    setShowLessonModal(false);
    router.push({
      pathname: '/(tabs)/lesson' as any,
      params: {
        moduleId: module.id.toString(),
        courseId: module.course_id.toString()
      }
    });
  };

  const renderChapterItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.chapterItem}
      onPress={() => handleChapterPress(item)}
    >
      <Image 
        source={getImageUrl(item.cover_image_url)} 
        style={styles.chapterImage} 
      />
      <View style={styles.chapterTextContainer}>
        <Text style={styles.chapterTitle}>{item.chapter_title}</Text>
        <Text style={styles.chapterSubtitle}>{item.course_title}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${item.progress_percentage.toFixed(2)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {item.completed_modules}/{item.total_modules} modules
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="gray" />
    </TouchableOpacity>
  );

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
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Favorites</Text>
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Favorited Chapters Section */}
        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>Favorited Chapters</Text> */}
          {loading ? (
            <Text style={styles.loadingText}>Loading favorited chapters...</Text>
          ) : favoritedChapters.length > 0 ? (
            <FlatList
              data={favoritedChapters}
              renderItem={renderChapterItem}
              keyExtractor={item => item.chapter_id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No favorited chapters yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the heart icon on chapter cards to add them to favorites</Text>
            </View>
          )}
        </View>

        {/* Music Section */}
        {favoriteMusic.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Music</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.musicScrollContent}
            >
              {favoriteMusic.map(item => (
                <View key={item.id} style={styles.musicItemContainer}>
                  <MusicCard 
                    title={item.title}
                    mediaUrl={item.mediaUrl}
                    onPlay={() => {
                      console.log('Playing music:', item.title);
                      // Handle play functionality
                    }}
                    style={styles.musicCard}
                  />
                  <Text style={styles.musicChapterTitle}>{item.chapterTitle}</Text>
                  <Text style={styles.musicCourseTitle}>{item.courseTitle}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Lesson Modal */}
      <LessonIndexModal
        visible={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        modules={modules}
        courseTitle={selectedChapter?.course_title || ''}
        onLessonPress={handleModulePress}
        completedLessons={new Set()}
        progressPercentage={selectedChapter?.progress_percentage || 0}
        chapterTitle={selectedChapter?.chapter_title || 'Complete'}
      />
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
  headerSpacer: {
    width: 28, // Same width as the menu icon to balance the layout
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
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
  // New styles for favorited chapters
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  chapterTextContainer: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chapterSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B8E23',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 60,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Music section styles
  musicScrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  musicItemContainer: {
    width: 200,
    marginRight: 15,
  },
  musicCard: {
    marginBottom: 8,
  },
  musicChapterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  musicCourseTitle: {
    fontSize: 12,
    color: '#666',
  },
});
