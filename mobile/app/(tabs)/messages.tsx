import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Text, Card, Button, FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '@/lib/auth';
import { apiService } from '@/lib/api';
import { AuthUser } from '@matchcv/shared';

export default function MessagesTabScreen() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch user's messages
  const { data: messagesData, isLoading: messagesLoading, refetch } = useQuery({
    queryKey: ['user-messages', currentUser?.id],
    queryFn: () => apiService.getUserMessages(),
    enabled: !!currentUser,
    refetchOnWindowFocus: true,
  });

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleChatPress = async (chatId: string) => {
    // Mark as read before navigating
    try {
      await apiService.markChatAsRead(chatId);
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
    router.push(`/chat/${chatId}`);
  };

  // Refresh messages when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        // Force a fresh fetch when returning to messages
        refetch();
        // Also invalidate to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      }
    }, [currentUser, refetch])
  );

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const renderChatItem = ({ item }: { item: any }) => (
    <Card style={styles.chatCard} onPress={() => handleChatPress(item.id)}>
      <Card.Content style={styles.chatContent}>
        <View style={styles.avatarContainer}>
          {item.otherUser.avatarUrl ? (
            <Image source={{ uri: item.otherUser.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.noPhotoAvatar}>
              <Text style={styles.noPhotoAvatarText}>No Photo</Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text variant="titleMedium" style={styles.userName}>
              {item.otherUser.displayName}
            </Text>
            {item.lastMessage && (
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatTime(new Date(item.lastMessage.timestamp))}
              </Text>
            )}
          </View>
          
          <View style={styles.messagePreview}>
            {item.lastMessage ? (
              <>
                <Text 
                  variant="bodyMedium" 
                  style={[
                    styles.lastMessage,
                    !item.lastMessage.isRead && styles.unreadMessage
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage.isFromMe ? 'You: ' : ''}{item.lastMessage.content}
                </Text>
                {item.hasUnread && (
                  <View style={styles.unreadDot} />
                )}
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.lastMessage}>
                No messages yet
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.emptyState}>
          <Text variant="titleLarge">Not logged in</Text>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            Please log in to view your messages
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/auth/login')}
            style={styles.emptyStateButton}
          >
            Log In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Messages
        </Text>
      </View>

      {messagesLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Loading messages...</Text>
        </View>
      ) : !messagesData?.data || (Array.isArray(messagesData.data) && messagesData.data.length === 0) ? (
        <View style={styles.emptyState}>
          <Text variant="titleLarge">No messages yet</Text>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            Start a conversation by saying hi to someone in the Discover tab!
          </Text>
          <Text variant="bodySmall" style={{color: '#999', marginTop: 8}}>
            Debug: {JSON.stringify(messagesData, null, 2)}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(tabs)/discover')}
            style={styles.emptyStateButton}
          >
            Discover Matches
          </Button>
        </View>
      ) : (
        <FlatList
          data={messagesData.data}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  emptyStateButton: {
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  chatCard: {
    marginBottom: 12,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    backgroundColor: '#fff',
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#6200ea',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    color: '#666',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6200ea',
    marginLeft: 8,
  },
  noPhotoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  noPhotoAvatarText: {
    fontSize: 8,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
});
