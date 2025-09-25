import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MeScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Me</Text>
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image 
            source={require('@/assets/images/favicon.png')} 
            style={styles.avatar} 
          />
          <Text style={styles.name}>Terri Philips</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {/* My Stuff */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My stuff</Text>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/notes' as any)}
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
  headerSpacer: {
    width: 28, // Same width as the menu icon to balance the layout
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
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
});
