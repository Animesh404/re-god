import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';

// Interface for Message data
interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

// Placeholder data
const initialMessages: Message[] = [
  { id: '1', text: 'Aertocitas', sender: 'other', timestamp: '12:31 PM' },
  { id: '2', text: 'Yer.', sender: 'me', timestamp: '12:31 PM' },
  { id: '3', text: 'art. Lesoret, ator eo setapl, seeta sd.', sender: 'other', timestamp: '12:31 PM' },
  { id: '4', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In nunc lacus vitae id facilisi amet pharetra a.', sender: 'other', timestamp: '12:31 PM' },
  { id: '5', text: 'Dorre, soritrala.', sender: 'me', timestamp: '12:31 PM' },
];

export default function ChatScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
        </View>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  const handleSend = () => {
    if (inputText.trim().length > 0) {
      const newMessage: Message = {
        id: (messages.length + 1).toString(),
        text: inputText,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: name || 'Chat', headerBackTitle: 'Connect' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messageList}
          inverted
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message"
            returnKeyType="send"
            onSubmitEditing={handleSend}
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
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 5,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
  },
  myMessageText: {
    color: 'black',
  },
  otherMessageText: {
    color: 'black',
  },
  timestamp: {
    fontSize: 10,
    color: 'gray',
    marginTop: 2,
    marginHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
});
