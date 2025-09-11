import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CircularProgress from '@/components/ui/CircularProgress';

interface Chapter {
  title: string;
  image: ImageSourcePropType;
}

// Placeholder data
const course = {
  title: 'The God You Can Love',
  progress: 25,
  image: require('@/assets/images/Course Title Photo - The God You Can Love-toni-minikus.jpg'),
};

const chapters: Chapter[] = [
  {
    title: 'Best Teacher',
    image: require('@/assets/images/Best Teacher-toni-minikus.jpg'),
  },
  {
    title: 'Another Chapter',
    image: require('@/assets/images/Best Teacher-toni-minikus.jpg'), 
  },
  // Add more chapters...
];

export default function CourseScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course</Text>
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Course Card */}
        <View style={styles.courseCard}>
          <Image source={course.image} style={styles.courseImage} />
          <Text style={styles.courseTitle}>{course.title}</Text>
          {/* Progress Circle */}
          <View style={styles.progressContainer}>
            <CircularProgress
              size={100}
              strokeWidth={10}
              progress={course.progress}
              backgroundColor="#E0E0E0"
              progressColor="#6B8E23"
            />
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>{course.progress}%</Text>
            </View>
            <Text style={styles.progressLabel}>Course Progress</Text>
          </View>
        </View>

        {/* Continue Section */}
        <View style={styles.continueSection}>
          <Text style={styles.continueText}>Continue</Text>
          <Text style={styles.continueSubtitle}>Pick up where you left off</Text>
        </View>

        {/* Chapters */}
        <View style={styles.chaptersSection}>
          <Text style={styles.chaptersTitle}>Chapters</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chapters.map((chapter, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => router.push({ pathname: '/(tabs)/lesson' as any, params: { chapterTitle: chapter.title } })}
              >
                <View style={styles.chapterCard}>
                  <Image source={chapter.image} style={styles.chapterImage} />
                  <View style={styles.chapterTextContainer}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <View style={styles.lessonButton}>
                      <Text style={styles.lessonButtonText}>Lesson Index</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            App Development by Adventech in partnership with TBD...
          </Text>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  courseCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  courseImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  courseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  continueSection: {
    backgroundColor: '#6B8E23', // Olive Drab
    padding: 20,
    marginVertical: 10,
  },
  continueText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueSubtitle: {
    color: 'white',
    fontSize: 14,
  },
  chaptersSection: {
    marginVertical: 10,
  },
  chaptersTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10,
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
    padding: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lessonButton: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lessonButtonText: {
    color: 'white',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
  },
});
