import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Interface for Conversation data
interface Conversation {
  id: string;
  name: string;
  avatar: ImageSourcePropType;
  lastMessage: string;
  lastMessageTime: string;
}

// Placeholder data
const conversations: Conversation[] = [
  {
    id: '1',
    name: 'Oscar Melendez',
    avatar: require('@/assets/images/adaptive-icon.png'), // Replace with actual image
    lastMessage: 'Short sentence, fun fact or welcome message about the teacher here, key is relatability.',
    lastMessageTime: '7:34 PM',
  },
];

export default function ConnectScreen() {
  const router = useRouter();
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => router.push({ pathname: '/(tabs)/chat' as any, params: { name: item.name } })}
    >
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.conversationTextContainer}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.conversationTime}>{item.lastMessageTime}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={2}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connect</Text>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  conversationTextContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationTime: {
    fontSize: 12,
    color: 'gray',
  },
  lastMessage: {
    fontSize: 14,
    color: 'gray',
  },
});
