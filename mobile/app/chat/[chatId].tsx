import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { AuthUser } from '@matchcv/shared';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  isRead: boolean;
  isFromMe: boolean;
}

interface ChatData {
  chatId: string;
  otherUser: {
    id: string;
    displayName: string;
  };
  messages: Message[];
}

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  // Load current user immediately
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };
    loadUser();
  }, []);

  // Fetch chat messages
  const { data: chatData, isLoading, error, refetch } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => apiService.getChatMessages(chatId!),
    enabled: !!chatId,
    refetchInterval: 3000, // Refetch every 3 seconds to get new messages
  });

  // Mark chat as read when user enters the conversation
  const markAsReadMutation = useMutation({
    mutationFn: () => apiService.markChatAsRead(chatId!),
    onSuccess: () => {
      // Invalidate messages list to refresh unread status
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
    },
    onError: (error) => {
      console.error('Failed to mark chat as read:', error);
    }
  });

  // Function to mark as read and refresh immediately
  const markAsReadAndRefresh = async () => {
    try {
      await apiService.markChatAsRead(chatId!);
      // Immediately invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      queryClient.refetchQueries({ queryKey: ['user-messages'] });
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
  };

  // Mark as read when entering the conversation
  useFocusEffect(
    React.useCallback(() => {
      if (chatId && currentUser) {
        markAsReadAndRefresh();
      }
    }, [chatId, currentUser])
  );

  // Mark as read when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (chatId && currentUser) {
        // Force mark as read when leaving
        markAsReadAndRefresh();
      }
    };
  }, [chatId, currentUser]);


  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => apiService.sendChatMessage(chatId!, content),
    onSuccess: () => {
      setNewMessage('');
      // Refetch messages to show the new one
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    }
  });

  const handleSendMessage = () => {
    if (newMessage.trim() && !sending) {
      setSending(true);
      sendMessageMutation.mutate(newMessage.trim(), {
        onSettled: () => setSending(false)
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Use current user to determine if message is from me
    const isFromMe = currentUser && item.senderId === currentUser.profile?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isFromMe ? styles.myMessage : styles.otherMessage
      ]}>
        <Card style={[
          styles.messageCard,
          isFromMe ? styles.myMessageCard : styles.otherMessageCard
        ]}>
          <Card.Content style={styles.messageContent}>
            <Text variant="bodyMedium" style={isFromMe ? styles.myMessageText : styles.messageText}>
              {item.content}
            </Text>
            <Text variant="bodySmall" style={styles.messageTime}>
              {formatTime(item.timestamp)}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !chatData?.success) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text variant="titleMedium">Failed to load chat</Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error?.message || 'Unknown error occurred'}
          </Text>
          <Button mode="contained" onPress={() => refetch()} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const chat = chatData.data as ChatData;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content 
          title={chat.otherUser.displayName}
          onPress={() => router.push(`/profile/${chat.otherUser.id}`)}
          style={styles.clickableHeader}
        />
      </Appbar.Header>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={chat.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            disabled={sending}
          />
          <Button
            mode="contained"
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            loading={sending}
            style={styles.sendButton}
          >
            Send
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  clickableHeader: {
    cursor: 'pointer',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  retryButton: {
    marginTop: 10,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 8,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
  },
  myMessageCard: {
    backgroundColor: '#6200ea',
  },
  otherMessageCard: {
    backgroundColor: '#fff',
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    color: '#000',
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    marginTop: 4,
    opacity: 0.7,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    minWidth: 80,
  },
});