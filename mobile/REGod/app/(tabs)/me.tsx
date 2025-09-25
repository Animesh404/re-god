import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext'; // Corrected path
import ApiService, { type Note } from '../../src/services/api'; // Corrected path

export default function MeScreen() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth(); // Get user, logout, and authLoading from context
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]); // State for recent notes

  useEffect(() => {
    const fetchRecentNotes = async () => {
      try {
        const notes = await ApiService.getNotes();
        // Get the 3 most recent notes
        setRecentNotes(notes.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch recent notes:", error);
      }
    };

    if (user) {
      fetchRecentNotes();
    }
  }, [user]);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B8E23" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Me</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image 
            source={require('@/assets/images/favicon.png')} 
            style={styles.avatar} 
          />
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {/* My Stuff */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My stuff</Text>
            {/* Recent Notes Section */}
            {recentNotes.length > 0 && (
              <View style={styles.recentNotesContainer}>
                {recentNotes.map((note) => (
                  <TouchableOpacity 
                    key={note.id} 
                    style={styles.noteCard}
                    onPress={() => router.push({ pathname: '/new-note', params: { noteId: note.id } })}
                  >
                    <Text style={styles.noteCardTitle} numberOfLines={1}>{note.lesson_title}</Text>
                    <Text style={styles.noteCardContent} numberOfLines={2}>{note.note_content}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/notes')}
            >
              <Text style={styles.menuItemText}>Notes</Text>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Share with friends</Text>
              <Ionicons name="share-outline" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Permissions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemText}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemText}>Reminders</Text>
              <Switch
                value={remindersEnabled}
                onValueChange={setRemindersEnabled}
              />
            </View>
          </View>

          {/* Other */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>About</Text>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>FAQ</Text>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF9F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    paddingTop: 100,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
  },
  editProfileButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  editProfileButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  menuContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 16,
  },
  recentNotesContainer: {
    marginBottom: 10,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  noteCardContent: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
