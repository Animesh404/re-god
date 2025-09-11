import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Interface for Note data
interface Note {
  id: string;
  date: string;
  title: string;
  preview: string;
}

// Placeholder data
const notes: Note[] = [
  { id: '1', date: '07/07/25', title: 'Personal Reflections', preview: 'Some sort of text preview or note of something...' },
  { id: '2', date: 'Date', title: 'Note Title', preview: 'Some sort of text preview or note of something...' },
  { id: '3', date: 'Date', title: 'Note Title', preview: 'Some sort of text preview or note of something...' },
  { id: '4', date: 'Date', title: 'Note Title', preview: 'Some sort of text preview or note of something...' },
];

export default function NotesScreen() {
  const router = useRouter();
  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity style={styles.noteItem}>
      <View>
        <Text style={styles.noteDate}>{item.date}</Text>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.notePreview}>{item.preview}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
        <TextInput placeholder="Search" style={styles.searchInput} />
      </View>

      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/new-note' as any)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F4',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 20,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  noteDate: {
    fontSize: 12,
    color: 'orange',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  notePreview: {
    fontSize: 14,
    color: 'gray',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});
