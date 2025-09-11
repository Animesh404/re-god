import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function NewNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');


  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.editorContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Lorem ipsum dolor sit amet..."
            value={content}
            onChangeText={setContent}
            multiline
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F4',
  },
  flex: {
    flex: 1,
  },
  doneButton: {
    color: '#007AFF', // Standard iOS blue
    fontSize: 16,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
