import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ImageSourcePropType, ActivityIndicator, Modal, FlatList, Dimensions, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CircularProgress from '@/components/ui/CircularProgress';
import LessonIndexModal from '@/components/LessonIndexModal';
import ApiService, { type Course, type Chapter, type Module, type DashboardResponse } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

// Interface for dashboard course data (different from Course interface)
interface DashboardCourse {
  course_id: number;
  course_title: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  difficulty: string;
  progress_percentage: number;
  is_new: boolean;
  is_continue_available: boolean;
  overall_progress_percentage: number;
}

// Helper function to convert relative URLs to full URLs
const getImageUrl = (imageUrl: string | null): any => {
  if (!imageUrl) return defaultChapterImage;
  if (imageUrl.startsWith('http')) return { uri: imageUrl };
  return { uri: `https://bf5773da486c.ngrok-free.app${imageUrl}` };
};

// Default placeholder image for fallback
const defaultCourseImage = require('@/assets/images/Course Title Photo - The God You Can Love-toni-minikus.jpg');
const defaultChapterImage = require('@/assets/images/Best Teacher-toni-minikus.jpg');

// Types for lesson completion tracking
interface LessonProgress {
  moduleId: number;
  completed: boolean;
  quizCompleted?: boolean;
  reflectionCompleted?: boolean;
  lastAccessedAt: string;
}

interface ChapterCardProps {
  chapter: Chapter;
  onPress: () => void;
}

export default function CourseScreen() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterProgress, setChapterProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [favoritedChapters, setFavoritedChapters] = useState<Set<number>>(new Set());
  const [currentCourseTitle, setCurrentCourseTitle] = useState<string>('');
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: DashboardCourse, index: number | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentCourseIndex(viewableItems[0].index);
    }
  }).current;

  useEffect(() => {
    // Only load dashboard if user is authenticated and auth loading is complete
    if (isAuthenticated && !authLoading && user) {
      loadDashboard();
      loadFavoritedChapters();
    }
  }, [isAuthenticated, authLoading, user]);

  const loadFavoritedChapters = async () => {
    try {
      const favoritedChaptersData = await ApiService.getChapterFavorites();
      const chapterIds = new Set(favoritedChaptersData.map(ch => ch.chapter_id));
      setFavoritedChapters(chapterIds);
    } catch (error) {
      console.error('Error loading favorited chapters:', error);
    }
  };

  useEffect(() => {
    if (dashboard && dashboard.available_courses.length > 0) {
      const currentCourse = dashboard.available_courses[currentCourseIndex];
      if (currentCourse) {
        handleCoursePress(currentCourse.course_id);
      }
    }
  }, [currentCourseIndex, dashboard]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Double-check authentication before making API call
      const hasValidToken = await ApiService.getStoredToken();
      if (!hasValidToken) {
        console.log('No valid token found, skipping dashboard load');
        setLoading(false);
        return;
      }

      const dashboardData = await ApiService.getDashboard();
      setDashboard(dashboardData);

      // Set the initial course index based on the last visited course
      if (dashboardData.last_visited_course && dashboardData.available_courses) {
        const initialIndex = dashboardData.available_courses.findIndex(
          (course: DashboardCourse) => course.course_id === dashboardData.last_visited_course?.course_id
        );
        if (initialIndex !== -1) {
          setCurrentCourseIndex(initialIndex);
        }
      }

      // No need to fetch modules/chapters here, the new useEffect will handle it
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      console.error('Error loading dashboard:', err);

      // If it's an authentication error, don't show error to user
      if (errorMessage.includes('Authentication expired') || errorMessage.includes('403')) {
        console.log('Authentication error in dashboard, will retry when auth is ready');
        setError(null);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLessonProgress = async (courseId: number) => {
    try {
      // Load user progress data - this would come from API in production
      const progressData = await ApiService.getDashboard(); // This contains progress info
      const completedSet = new Set<number>();

      // For now, we'll use the progress percentage to estimate completed lessons
      // In production, this would come from a dedicated progress API
      if (progressData.last_visited_course?.overall_progress_percentage) {
        const totalModules = modules.length;
        const completedCount = Math.floor((progressData.last_visited_course.overall_progress_percentage / 100) * totalModules);

        for (let i = 0; i < Math.min(completedCount, modules.length); i++) {
          completedSet.add(modules[i].id);
        }
      }

      setCompletedLessons(completedSet);
    } catch (error) {
      console.error('Error loading lesson progress:', error);
      // Continue without progress data
    }
  };

  const handleCoursePress = async (courseId: number) => {
    try {
      // Load chapters, modules, and chapter progress for the selected course
      const [courseChapters, courseModules, progressData] = await Promise.all([
        ApiService.getCourseChapters(courseId),
        ApiService.getCourseModules(courseId),
        ApiService.getChapterProgress(courseId)
      ]);
      
      setChapters(courseChapters);
      setModules(courseModules);
      setChapterProgress(progressData.chapters);
      
      const course = dashboard?.available_courses.find(c => c.course_id === courseId);
      setCurrentCourseTitle(course?.course_title || `Course ${courseId}`);

      // Load lesson progress for this course
      await loadLessonProgress(courseId);
    } catch (err) {
      console.error('Error loading course chapters/modules:', err);
    }
  };

  const handleModulePress = async (module: Module) => {
    try {
      // console.log('handleModulePress called with module:', { id: module.id, title: module.title, course_id: module.course_id });
      
      // Record that user accessed this module
      await ApiService.updateCourseProgress(module.course_id, 0, module.id, 'visited');

      // Navigate to lesson - progress will be updated on completion
      router.push({
        pathname: '/(tabs)/lesson' as any,
        params: {
          moduleId: module.id.toString(),
          courseId: module.course_id.toString()
        }
      });
    } catch (err) {
      console.error('Error accessing lesson:', err);
      // Still allow navigation even if progress update fails
      router.push({
        pathname: '/(tabs)/lesson' as any,
        params: {
          moduleId: module.id.toString(),
          courseId: module.course_id.toString()
        }
      });
    }
  };

  const handleLessonCompleted = (moduleId: number) => {
    setCompletedLessons(prev => new Set([...prev, moduleId]));
  };

  const toggleChapterFavorite = async (chapterId: number, event: any) => {
    event.stopPropagation(); // Prevent triggering the chapter card press
    
    try {
      const response = await ApiService.toggleChapterFavorite(chapterId);
      
      if (response.action === 'added') {
        setFavoritedChapters(prev => new Set([...prev, chapterId]));
        console.log('Added chapter to favorites:', chapterId);
      } else if (response.action === 'removed') {
        setFavoritedChapters(prev => {
          const newSet = new Set(prev);
          newSet.delete(chapterId);
          return newSet;
        });
        console.log('Removed chapter from favorites:', chapterId);
      }
    } catch (error) {
      console.error('Error toggling chapter favorite:', error);
    }
  };

  // Animated Heart Component
  const AnimatedHeart = ({ chapterId }: { chapterId: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isFavorited = favoritedChapters.has(chapterId);

    const handlePress = (event: any) => {
      // Animate the heart
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      toggleChapterFavorite(chapterId, event);
    };

    return (
      <TouchableOpacity
        style={styles.heartIcon}
        onPress={handlePress}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={24}
            color={isFavorited ? "#FF6B6B" : "rgba(255, 255, 255, 0.8)"}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const openLessonModal = () => {
    setShowLessonModal(true);
  };

  const closeLessonModal = () => {
    setShowLessonModal(false);
  };

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B8E23" />
          <Text style={styles.loadingText}>
            {authLoading ? 'Authenticating...' : 'Loading courses...'}
          </Text>
        </View>
      </View>
    );
  }

  // Don't render anything if user is not authenticated and auth is still loading
  if (!isAuthenticated && !user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B8E23" />
          <Text style={styles.loadingText}>Please log in to view courses</Text>
        </View>
      </View>
    );
  }


  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course</Text>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Use API data
  const availableCourses = dashboard?.available_courses || [];

  const renderCourseCard = ({ item: course }: { item: DashboardCourse }) => (
    <View style={styles.courseCard}>
      <Image
        source={course.thumbnail_url ? { uri: course.thumbnail_url } : defaultCourseImage}
        style={styles.courseImage}
      />
      <Text style={styles.courseTitle}>{course.course_title}</Text>
      {/* Progress Circle */}
      <View style={styles.progressContainer}>
        <CircularProgress
          size={90}
          strokeWidth={8}
          progress={course.overall_progress_percentage}
          backgroundColor="#E8E8E8"
          progressColor="#6B8E23"
        />
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>{course.overall_progress_percentage.toFixed(1)}%</Text>
        </View>
        <Text style={styles.progressLabel}>Course Progress</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course</Text>
      </View>

      <ScrollView style={styles.scrollView}>

        {/* Course Card Carousel */}
        {availableCourses.length > 0 && (
          <FlatList<DashboardCourse>
            data={availableCourses as DashboardCourse[]}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.course_id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50,
            }}
            style={styles.courseCarousel}
          />
        )}

        {/* Continue Section with Green Background */}
        <View style={styles.continueSection}>
          <Text style={styles.continueText}>Continue</Text>
          <Text style={styles.continueSubtitle}>Pick up where you left off</Text>
        </View>

        {/* Green Background Container */}
        <View style={styles.greenBackgroundContainer}>
          {/* Continue Chapter Card */}
          {chapterProgress.length > 0 && (
            <View style={styles.continueCardSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
              >
                {/* Show current chapter with module progress */}
                {(() => {
                  // Find the current chapter (first incomplete or last chapter)
                  const currentChapter = chapterProgress.find(ch => !ch.is_completed) || chapterProgress[chapterProgress.length - 1];
                  
                  // If no chapter progress data, try to show continue card from dashboard data
                  if (!currentChapter && dashboard?.last_visited_course) {
                    const currentCourse = dashboard?.available_courses[currentCourseIndex];
                    const lastVisitedModule = (dashboard?.last_visited_course?.course_id === currentCourse?.course_id) 
                      ? dashboard?.last_visited_course?.last_visited_module_id 
                      : null;
                    
                    if (lastVisitedModule) {
                      const targetModule = modules.find(m => m.id === lastVisitedModule);
                      console.log('Fallback continue card - targetModule:', targetModule);
                      if (targetModule) {
                        return (
                          <TouchableOpacity
                            onPress={() => handleModulePress(targetModule)}
                            style={styles.continueCard}
                          >
                            <Image
                              source={getImageUrl(dashboard.last_visited_course.thumbnail_url || null)}
                              style={styles.continueCardImage}
                            />
                            <View style={styles.continueCardOverlay} />
                            <View style={styles.continueCardContent}>
                              <View style={styles.continueProgressContainer}>
                                <CircularProgress
                                  size={50}
                                  strokeWidth={4}
                                  progress={dashboard.last_visited_course.overall_progress_percentage}
                                  backgroundColor="rgba(255, 255, 255, 0.45)"
                                  progressColor="#FFFFFF"
                                />
                                <Text style={styles.continueProgressText}>
                                  {dashboard.last_visited_course.overall_progress_percentage.toFixed(1)}%
                                </Text>
                              </View>
                              <Text style={styles.continueCardTitle}>{dashboard.last_visited_course.course_title}</Text>
                              <Text style={styles.continueCardTitle}>
                                Continue: {targetModule.title}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }
                    }
                  }
                  
                  if (!currentChapter) return null;

                  // Get the last visited module from dashboard, but only if it's from the current course
                  const currentCourse = dashboard?.available_courses[currentCourseIndex];
                  const lastVisitedModule = (dashboard?.last_visited_course?.course_id === currentCourse?.course_id) 
                    ? dashboard?.last_visited_course?.last_visited_module_id 
                    : null;
                  
                  // console.log('Continue card debug:', {
                  //   currentCourseId: currentCourse?.course_id,
                  //   lastVisitedCourseId: dashboard?.last_visited_course?.course_id,
                  //   lastVisitedModule,
                  //   modules: modules.map(m => ({ id: m.id, title: m.title })),
                  //   currentChapter: currentChapter?.chapter_title,
                  //   nextModule: currentChapter?.next_module,
                  //   completedLessons: Array.from(completedLessons),
                  //   chapterProgress: chapterProgress.map(ch => ({ 
                  //     id: ch.chapter_id, 
                  //     title: ch.chapter_title, 
                  //     next_module: ch.next_module,
                  //     is_completed: ch.is_completed 
                  //   }))
                  // });
                  
                  const targetModule = lastVisitedModule 
                    ? modules.find(m => m.id === lastVisitedModule)
                    : currentChapter.next_module 
                      ? modules.find(m => m.id === currentChapter.next_module.id)
                      : modules.find(m => !completedLessons.has(m.id)); // Fallback to first incomplete module
                  
                  // console.log('Target module:', targetModule);

                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (targetModule) {
                          handleModulePress(targetModule);
                        }
                      }}
                      style={styles.continueCard}
                    >
                      <Image
                        source={getImageUrl(currentChapter.cover_image_url || null)}
                        style={styles.continueCardImage}
                      />
                      <View style={styles.continueCardOverlay} />
                      <View style={styles.continueCardContent}>
                        <View style={styles.continueProgressContainer}>
                          <CircularProgress
                            size={50}
                            strokeWidth={4}
                            progress={currentChapter.progress_percentage}
                            backgroundColor="rgba(255, 255, 255, 0.45)"
                            progressColor="#FFFFFF"
                          />
                          <Text style={styles.continueProgressText}>
                            {currentChapter.progress_percentage.toFixed(1)}%
                          </Text>
                        </View>
                        <Text style={styles.continueCardTitle}>{currentChapter.chapter_title}</Text>
                        {/* <Text style={styles.continueCardTitle}>
                          {currentChapter.completed_modules}/{currentChapter.total_modules} modules completed
                        </Text> */}
                        {targetModule && (
                          <Text style={styles.continueCardTitle}>
                            {lastVisitedModule ? 'Continue: ' : currentChapter.next_module ? 'Next: ' : 'Start: '}{targetModule.title}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })()}
              </ScrollView>

              {/* Lesson Index under the continue card */}
              {/* <TouchableOpacity style={styles.lessonIndexButton} onPress={openLessonModal}>
                <Text style={styles.lessonIndexButtonText}>Lesson Index</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity> */}
            </View>
          )}

          {/* Available Courses with Green Background */}
          <View style={styles.continueSection}>
          <Text style={styles.continueText}>Chapters</Text>
        </View>
          <View style={styles.availableCoursesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {chapterProgress.map((chapterProgress) => (
                <TouchableOpacity
                  key={chapterProgress.chapter_id}
                  onPress={openLessonModal}
                >
                  <View style={styles.chapterCard}>
                    <Image
                      source={getImageUrl(chapterProgress.cover_image_url || null)}
                      style={styles.chapterImage}
                    />
                    {/* Heart Icon */}
                    <AnimatedHeart chapterId={chapterProgress.chapter_id} />
                    <View style={styles.chapterTextContainer}>
                      <Text style={styles.chapterTitle}>{chapterProgress.chapter_title}</Text>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressContainer}>
                          <View 
                            style={[
                              styles.progressContainer, 
                              { width: `${chapterProgress.progress_percentage.toFixed(1)}%` }
                            ]} 
                          />
                        </View>
                        {/* <Text style={styles.progressText}>
                          {chapterProgress.completed_modules}/{chapterProgress.total_modules} modules
                        </Text> */}
                      </View>
                      <View style={styles.lessonButton}>
                        <Text style={styles.lessonButtonText}>
                          Lesson Index
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Footer with Green Background */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              App Development by Adventech in partnership with TBD...
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Lesson Index Modal */}
      <LessonIndexModal
        visible={showLessonModal}
        onClose={closeLessonModal}
        modules={modules}
        courseTitle={currentCourseTitle}
        onLessonPress={handleModulePress}
        completedLessons={completedLessons}
        progressPercentage={chapterProgress.length > 0 ? chapterProgress[0]?.progress_percentage || 0 : 0}
        chapterTitle="Complete"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60, // Account for status bar
    paddingBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Light translucent background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingTop: 100, // Account for header height
  },
  courseCarousel: {
    maxHeight: 450, // Adjust as needed
  },
  courseCard: {
    width: screenWidth,
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 10,
  },
  courseImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#6B8E23',
    lineHeight: 30,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 35,
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B8E23',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B8E23',
    marginTop: 8,
    fontWeight: '500',
  },
  continueSection: {
    backgroundColor: '#56621c',
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginTop: 30,
  },
  continueText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  continueSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  greenBackgroundContainer: {
    backgroundColor: '#56621c', // Olive green background for everything below Continue
  },
  availableCoursesSection: {
    paddingHorizontal: 5,
    marginBottom: 50,
    alignItems: 'center', // Center align the course cards
  },
  chapterCard: {
    width: 250,
    height: 350,
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chapterImage: {
    width: '100%',
    height: '100%',
  },
  chapterTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
  },
  chapterTitle: {
    fontSize: 40,
    fontWeight: '400',
    marginBottom: 10,
  },
  lessonButton: {
    backgroundColor: 'black',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
  },
  lessonButtonText: {
    color: 'white',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#56621c', // Green background to match design
  },
  footerText: {
    fontSize: 12,
    color: 'white', // White text on green background
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B8E23',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  continueCardSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center', // Center align the cards
  },
  continueCard: {
    width: 300,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  continueCardImage: {
    width: '100%',
    height: '100%',
  },
  continueCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.51)',
  },
  continueCardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  continueProgressText: {
    position: 'absolute',
    textAlign: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  continueCardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Lesson Index Button
  lessonIndexButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 20,
    width: 280, // Same width as continue card for consistency
    alignSelf: 'center', // Center the button
  },
  lessonIndexButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollViewContent: {
    alignItems: 'center', // Center align scroll view content
    justifyContent: 'center',
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
