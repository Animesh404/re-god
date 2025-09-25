import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MusicCard from '@/components/MusicCard';
import SuccessModal from '@/components/SuccessModal';
import ApiService, { type Module } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

// Types for quiz and reflection functionality
interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'reflection' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer?: string;
  required: boolean;
}

interface QuizResponse {
  questionId: string;
  answer: string;
  type: QuizQuestion['type'];
}

interface ResponseModalProps {
  visible: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  onSubmit: (responses: QuizResponse[]) => void;
  title: string;
}

export default function LessonScreen() {
  const { moduleId, courseId } = useLocalSearchParams<{ moduleId: string; courseId?: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [reflectionText, setReflectionText] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [nextModule, setNextModule] = useState<Module | null>(null);

  // Response Modal Component
  function ResponseModal({ visible, onClose, questions, onSubmit, title }: ResponseModalProps) {
    const [currentResponses, setCurrentResponses] = useState<QuizResponse[]>([]);
    const [currentReflection, setCurrentReflection] = useState('');
    const currentQuestion = questions[currentQuestionIndex];

    const handleAnswerSelect = (answer: string) => {
      const newResponse: QuizResponse = {
        questionId: currentQuestion.id,
        answer,
        type: currentQuestion.type
      };

      setCurrentResponses(prev => {
        const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
        return [...filtered, newResponse];
      });
    };

    const handleNext = () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        onSubmit(currentResponses);
      }
    };

    const handlePrevious = () => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    };

    const canProceed = () => {
      if (!currentQuestion.required) return true;
      const response = currentResponses.find(r => r.questionId === currentQuestion.id);
      return response && response.answer.trim().length > 0;
    };

    if (!currentQuestion) return null;

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView style={responseModalStyles.container}>
          <View style={responseModalStyles.header}>
            <Text style={responseModalStyles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={responseModalStyles.closeButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={responseModalStyles.progressContainer}>
            <Text style={responseModalStyles.progressText}>
              {currentQuestionIndex + 1} of {questions.length}
            </Text>
            <View style={responseModalStyles.progressBar}>
              <View style={[responseModalStyles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
            </View>
          </View>

          <ScrollView style={responseModalStyles.content}>
            <View style={responseModalStyles.questionContainer}>
              <Text style={responseModalStyles.questionTitle}>{currentQuestion.question}</Text>

              {currentQuestion.type === 'reflection' && (
                <TextInput
                  style={responseModalStyles.reflectionInput}
                  multiline
                  placeholder="Write your reflection here..."
                  value={currentReflection}
                  onChangeText={setCurrentReflection}
                  textAlignVertical="top"
                />
              )}

              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <View style={responseModalStyles.optionsContainer}>
                  {currentQuestion.options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        responseModalStyles.option,
                        currentResponses.find(r => r.questionId === currentQuestion.id)?.answer === option &&
                        responseModalStyles.selectedOption
                      ]}
                      onPress={() => handleAnswerSelect(option)}
                    >
                      <Text style={responseModalStyles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {currentQuestion.type === 'true_false' && (
                <View style={responseModalStyles.optionsContainer}>
                  {['True', 'False'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        responseModalStyles.option,
                        currentResponses.find(r => r.questionId === currentQuestion.id)?.answer === option &&
                        responseModalStyles.selectedOption
                      ]}
                      onPress={() => handleAnswerSelect(option)}
                    >
                      <Text style={responseModalStyles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {currentQuestion.type === 'short_answer' && (
                <TextInput
                  style={responseModalStyles.shortAnswerInput}
                  placeholder="Enter your answer..."
                  value={currentResponses.find(r => r.questionId === currentQuestion.id)?.answer || ''}
                  onChangeText={(text) => handleAnswerSelect(text)}
                />
              )}
            </View>
          </ScrollView>

          <View style={responseModalStyles.footer}>
            <TouchableOpacity
              style={[responseModalStyles.navButton, responseModalStyles.previousButton]}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <Text style={responseModalStyles.previousButtonText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                responseModalStyles.navButton,
                responseModalStyles.nextButton,
                !canProceed() && responseModalStyles.disabledButton
              ]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={responseModalStyles.nextButtonText}>
                {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  useEffect(() => {
    if (moduleId && isAuthenticated && !authLoading) {
      loadModule();
    }
  }, [moduleId, isAuthenticated, authLoading]);

  const loadModule = async () => {
    try {
      setLoading(true);
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      
      // Get all modules for the course and find the specific one
      const modules = await ApiService.getCourseModules(Number(courseId));
      const foundModule = modules.find(m => m.id === Number(moduleId));
      
      if (!foundModule) {
        throw new Error('Lesson not found');
      }
      
      // Find the next module in the sequence
      const sortedModules = modules.sort((a, b) => a.order - b.order);
      const currentIndex = sortedModules.findIndex(m => m.id === Number(moduleId));
      const nextModule = currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null;
      
      setModule(foundModule);
      setNextModule(nextModule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponsePress = () => {
    if (!module?.response_prompt) {
      Alert.alert('No Response Required', 'This lesson does not require a response.');
      return;
    }

    // Parse the response prompt to create quiz questions
    const questions = parseResponsePrompt(module.response_prompt);
    if (questions.length === 0) {
      Alert.alert('Response', 'Please provide your reflection on this lesson.');
      return;
    }

    setShowResponseModal(true);
    setCurrentQuestionIndex(0);
    setResponses([]);
  };

  const parseResponsePrompt = (prompt: string): QuizQuestion[] => {
    // This is a simplified parser - in production, you might want to use a more sophisticated
    // parsing system or have the backend provide structured quiz data
    const questions: QuizQuestion[] = [];

    // Try to identify different types of questions in the prompt
    const lines = prompt.split('\n').filter(line => line.trim());

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('Q:') || line.includes('?')) {
        const questionText = line.replace(/^Q:\s*/, '').replace(/\?$/, '');
        let type: QuizQuestion['type'] = 'reflection';
        let options: string[] | undefined;

        // Check if it's a multiple choice question
        if (line.toLowerCase().includes('choose') || line.toLowerCase().includes('select')) {
          type = 'multiple_choice';
          options = [];

          // Look for options in subsequent lines
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.match(/^[A-D]\./) || nextLine.match(/^\d+\./)) {
              options.push(nextLine);
            } else if (nextLine && !nextLine.includes('?')) {
              break;
            }
          }
        } else if (line.toLowerCase().includes('true or false') || line.toLowerCase().includes('yes or no')) {
          type = 'true_false';
        } else if (line.toLowerCase().includes('explain') || line.toLowerCase().includes('describe')) {
          type = 'short_answer';
        }

        questions.push({
          id: `q${i + 1}`,
          type,
          question: questionText,
          options: options?.length ? options : undefined,
          required: true
        });
      }
    }

    // If no structured questions found, create a single reflection question
    if (questions.length === 0) {
      questions.push({
        id: 'reflection1',
        type: 'reflection',
        question: prompt,
        required: true
      });
    }

    return questions;
  };

  const handleResponseSubmit = async (submittedResponses: QuizResponse[]) => {
    try {
      setShowResponseModal(false);

      // Save responses to backend
      if (module && courseId) {
        // Create a note with the response
        await ApiService.createNote(
          parseInt(courseId),
          parseInt(moduleId),
          `Lesson Response: ${submittedResponses.map(r => r.answer).join(' | ')}`
        );

        // Mark lesson as completed with responses
        await ApiService.completeLesson(
          parseInt(courseId),
          parseInt(moduleId),
          submittedResponses
        );

        // Update course progress - let backend calculate the correct percentage
        // based on total modules in the course
        await ApiService.updateCourseProgress(
          parseInt(courseId),
          null, // Let backend calculate progress percentage
          parseInt(moduleId),
          'completed'
        );
      }

      // Show success modal instead of alert
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    }
  };

  const handleActionPress = (action: string) => {
    if (!module) return;
    
    let content = '';
    switch (action) {
      case 'further_study':
        content = module.further_study || 'No further study content available';
        break;
      case 'personal_experiences':
        content = module.personal_experiences || 'No personal experiences content available';
        break;
      case 'resources':
        content = module.resources || 'No resources available';
        break;
      case 'artwork':
        content = module.artwork || 'No artwork available';
        break;
    }
    
    Alert.alert(action.replace('_', ' ').toUpperCase(), content);
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    
    if (nextModule && courseId) {
      // Navigate to next module
      router.push(`/lesson?moduleId=${nextModule.id}&courseId=${courseId}`);
    } else {
      // No next module, go back to course screen
      router.replace('/(tabs)/course');
    }
  };

  // Helper function to convert relative URLs to full URLs
  const getImageUrl = (imageUrl: string | null): any => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return { uri: imageUrl };
    const fullUrl = `https://bf5773da486c.ngrok-free.app${imageUrl}`;
    console.log('Generated image URL:', fullUrl);
    return { uri: fullUrl };
  };

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B8E23" />
          <Text style={styles.loadingText}>
            {authLoading ? 'Authenticating...' : 'Loading lesson...'}
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please log in to view lessons</Text>
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
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadModule}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!module) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lesson not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              // Fallback to course screen if no previous screen
              router.replace('/(tabs)/course');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Header Image */}
        {module.header_image_url ? (
        <Image 
            source={getImageUrl(module.header_image_url)}
          style={styles.headerImage}
            onError={(error) => {
              console.log('Image loading error:', error);
            }}
            onLoad={() => {
              console.log('Image loaded successfully');
            }}
          />
        ) : (
          <View style={styles.headerPlaceholder}>
            <Ionicons name="image-outline" size={64} color="gray" />
            <Text style={styles.placeholderText}>No image available</Text>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>{module.title}</Text>

          {/* Content */}
          {module.content && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Content</Text>
              <Text style={styles.contentText}>{module.content}</Text>
            </View>
          )}

          {/* Key Verses */}
          {module.key_verses && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key verses</Text>
              <View style={styles.keyVersesCard}>
                <Text style={styles.keyVersesText}>{module.key_verses}</Text>
                {module.key_verses_ref && (
                  <Text style={styles.keyVersesReference}>Reference: {module.key_verses_ref}</Text>
                )}
              </View>
          </View>
          )}

          {/* Lesson Study */}
          {module.lesson_study && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lesson study</Text>
              <Text style={styles.contentText}>{module.lesson_study}</Text>
              {module.lesson_study_ref && (
                <Text style={styles.referenceText}>Reference: {module.lesson_study_ref}</Text>
              )}
          </View>
          )}

          {/* Response Unlock */}
          {module.response_prompt && (
          <View style={styles.unlockSection}>
            <Ionicons name="lock-closed" size={32} color="gray" />
            <Text style={styles.unlockText}>Respond to unlock the next lesson</Text>
              <Text style={styles.promptText}>{module.response_prompt}</Text>
              <TouchableOpacity style={styles.responseButton} onPress={handleResponsePress}>
                <Text style={styles.responseButtonText}>Start Response</Text>
            </TouchableOpacity>
          </View>
          )}

          {/* Music Selection */}
          {module.music_selection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Music selection</Text>
            <MusicCard 
              title={module.music_selection}
              mediaUrl={module.media_url}
              onPlay={() => {
                // Handle play functionality
                console.log('Playing music:', module.music_selection);
              }}
            />
          </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {module.further_study && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => handleActionPress('further_study')}
              >
              <Text style={styles.actionButtonText}>Further study</Text>
            </TouchableOpacity>
            )}
            {module.personal_experiences && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleActionPress('personal_experiences')}
              >
              <Text style={styles.actionButtonText}>Personal Experiences</Text>
            </TouchableOpacity>
            )}
            {module.resources && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleActionPress('resources')}
              >
              <Text style={styles.actionButtonText}>Resources</Text>
            </TouchableOpacity>
            )}
            {module.artwork && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleActionPress('artwork')}
              >
              <Text style={styles.actionButtonText}>Artwork</Text>
            </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Response Modal */}
      {module?.response_prompt && (
        <ResponseModal
          visible={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          questions={parseResponsePrompt(module.response_prompt)}
          title="Lesson Response"
          onSubmit={handleResponseSubmit}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onContinue={handleSuccessContinue}
        title="Nice work!"
        subtitle={nextModule ? "You've unlocked the next lesson!" : "You've completed this lesson!"}
        buttonText="Continue"
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50, // Account for status bar
    paddingBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Light translucent background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  scrollView: {
    flex: 1,
    paddingTop: 100, // Account for header height
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
  headerImage: {
    width: '100%',
    height: 250,
  },
  headerPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: 'gray',
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
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  referenceText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
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
  promptText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
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
  keyVersesCard: {
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
  keyVersesText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
    marginBottom: 8,
  },
  keyVersesReference: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
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

// Response Modal Styles
const responseModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B8E23',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 28,
  },
  reflectionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  shortAnswerInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  selectedOption: {
    borderColor: '#6B8E23',
    backgroundColor: '#F0F8F0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: '#6B8E23',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  previousButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});