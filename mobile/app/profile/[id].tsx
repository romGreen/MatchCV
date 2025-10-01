import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, Alert, Dimensions, FlatList } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { locationService } from '@/lib/location';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  // Fetch user profile
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => apiService.getUserProfile(id!),
    enabled: !!id,
  });

  // Fetch match score if not current user
  const { data: matchScoreData } = useQuery({
    queryKey: ['match-score', id, currentUser?.id],
    queryFn: () => apiService.getMatchScore(id!),
    enabled: !!id && !!currentUser && currentUser.profile?.id !== id,
  });


  // Check if chat exists
  const { data: messagesData } = useQuery({
    queryKey: ['user-messages', currentUser?.id],
    queryFn: () => apiService.getUserMessages(),
    enabled: !!currentUser,
  });

  // Find existing chat with this user
  const existingChat = messagesData?.data?.find((chat: any) => 
    chat.otherUser.id === id
  );

  // Send "Say hi" mutation
  const sayHiMutation = useMutation({
    mutationFn: (toUserId: string) => 
      apiService.sendSayHiMessage(toUserId, currentUser?.id || ''),
    onSuccess: (response) => {
      if (response.success && response.data?.chatId) {
        Alert.alert(
          'Chat Started!',
          'Your "Say hi" message has been sent. Opening chat...',
          [
            { 
              text: 'OK', 
              onPress: () => router.push(`/chat/${response.data?.chatId}`)
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to start chat');
      }
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      console.error('Say hi error:', error);
    },
  });

  const handleSayHi = () => {
    if (!userData?.data || !currentUser) return;
    
    Alert.alert(
      'Say Hi',
      'This will send a friendly message to start a conversation. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => sayHiMutation.mutate(userData.data?.id || '') }
      ]
    );
  };

  const handleGoToChat = () => {
    if (existingChat) {
      router.push(`/chat/${existingChat.id}`);
    }
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData?.data) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.error}>
          <Text variant="titleLarge">Profile not found</Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            This user profile could not be found.
          </Text>
          <Button mode="outlined" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const user = userData.data;
  
  // Defensive programming - ensure user object has required properties
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.error}>
          <Text variant="titleLarge">Profile not found</Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            This user profile could not be found.
          </Text>
          <Button mode="outlined" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  
  // We need to compare the current user's profile ID with the viewed profile ID
  // Since currentUser.id is the User ID, we need to get the current user's profile ID
  const isCurrentUser = currentUser?.profile?.id === user.id;

  // Create array of all photos - first photo is the main/avatar photo
  const getAllPhotos = () => {
    const photos = [];
    if (user.photos && user.photos.length > 0) {
      photos.push(...user.photos.map((photo: any, index: number) => ({ 
        ...photo, 
        isAvatar: index === 0 // First photo is the main/avatar photo
      })));
    }
    return photos;
  };

  const allPhotos = getAllPhotos();

  // Use match score from API if not current user
  const matchScore = !isCurrentUser && matchScoreData?.data ? {
    score: matchScoreData.data.score,
    sharedHobbies: matchScoreData.data.sharedHobbies,
    distance: matchScoreData.data.distance,
  } : null;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            {/* Name and Match Score */}
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {user.displayName || 'Unknown User'}
              </Text>
              {matchScore && (
                <View style={styles.matchScoreContainer}>
                  <Text variant="titleLarge" style={styles.matchScore}>
                    {matchScore?.score || 0}%
                  </Text>
                  <Text variant="bodySmall" style={styles.matchLabel}>
                    Match
                  </Text>
                </View>
              )}
            </View>
            
            {/* Photos */}
            {allPhotos.length > 0 ? (
              <View style={styles.photoCarousel}>
                <FlatList
                  data={allPhotos}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={screenWidth - 32}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32));
                    setCurrentPhotoIndex(index);
                  }}
                  renderItem={({ item }) => (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: item.photoUrl }} style={styles.photoImage} />
                      {item.isAvatar && (
                        <View style={styles.avatarBadge}>
                          <Text style={styles.avatarBadgeText}>Main</Text>
                        </View>
                      )}
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  style={styles.photoList}
                  getItemLayout={(data, index) => ({
                    length: screenWidth - 32,
                    offset: (screenWidth - 32) * index,
                    index,
                  })}
                />
                {allPhotos.length > 1 && (
                  <View style={styles.photoIndicators}>
                    {allPhotos.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentPhotoIndex && styles.activeIndicator
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noPhotoContainer}>
                <Text style={styles.noPhotoText}>No photos</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Bio */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyLarge" style={styles.bio}>
              {user.bio || 'No bio available'}
            </Text>
          </Card.Content>
        </Card>

        {/* Hobbies */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Hobbies
            </Text>
            <View style={styles.hobbiesContainer}>
              {user?.hobbies && Array.isArray(user.hobbies) && user.hobbies.length > 0 ? user.hobbies.filter(hobby => hobby && typeof hobby === 'object' && (hobby.name || hobby.id)).map((hobby) => {
                const isShared = matchScore?.sharedHobbies?.some((sharedHobby: any) => sharedHobby.id === hobby.id);
                return (
                  <Chip
                    key={hobby.id || `hobby-${Math.random()}`}
                    style={[
                      styles.hobbyChip,
                      isShared && styles.sharedHobbyChip
                    ]}
                    textStyle={isShared ? styles.sharedHobbyText : undefined}
                  >
                    {`${hobby.name || 'Unknown Hobby'}${isShared ? ' ✓' : ''}`}
                  </Chip>
                );
              }) : (
                <Text variant="bodyMedium" style={styles.noHobbiesText}>
                  No hobbies listed
                </Text>
              )}
            </View>
            {matchScore && (
              <Text variant="bodySmall" style={styles.sharedHobbiesText}>
                {matchScore?.sharedHobbies?.length || 0} shared hobbies
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Additional Information */}
        {((user.age && typeof user.age === 'number') || (user.job && typeof user.job === 'string') || (user.company && typeof user.company === 'string') || (user.education && typeof user.education === 'string') || (user.university && typeof user.university === 'string') || 
          (user.relationshipStatus && typeof user.relationshipStatus === 'string') || (user.lookingFor && typeof user.lookingFor === 'string') || (user.languages && typeof user.languages === 'string') || (user.height && typeof user.height === 'number') || 
          (user.lifestyle && typeof user.lifestyle === 'string') || (user.interests && typeof user.interests === 'string')) && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                More About {user.displayName || 'User'}
              </Text>
              
              {user.age && typeof user.age === 'number' && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Age:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.age}</Text>
                </View>
              )}
              
              {user.job && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Job:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.job || 'Not specified'}</Text>
                </View>
              )}
              
              {user.company && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Company:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.company || 'Not specified'}</Text>
                </View>
              )}
              
              {user.education && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Education:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.education || 'Not specified'}</Text>
                </View>
              )}
              
              {user.university && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>University:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.university || 'Not specified'}</Text>
                </View>
              )}
              
              {user.relationshipStatus && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Status:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.relationshipStatus || 'Not specified'}</Text>
                </View>
              )}
              
              {user.lookingFor && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Looking for:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.lookingFor || 'Not specified'}</Text>
                </View>
              )}
              
              {user.languages && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Languages:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.languages || 'Not specified'}</Text>
                </View>
              )}
              
              {user.height && typeof user.height === 'number' && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Height:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.height} cm</Text>
                </View>
              )}
              
              {user.lifestyle && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Lifestyle:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.lifestyle || 'Not specified'}</Text>
                </View>
              )}
              
              {user.interests && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Interests:</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{user.interests || 'Not specified'}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Location */}
        {!isCurrentUser && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Location
              </Text>
              {((user.city && typeof user.city === 'string' && user.city.trim() !== '') || (user.country && typeof user.country === 'string' && user.country.trim() !== '')) ? (
                <>
                  <Text variant="bodyLarge" style={styles.locationText}>
                    {user.city && user.country ? `${user.city}, ${user.country}` : (user.city || user.country || 'Unknown Location')}
                  </Text>
                  {matchScore && matchScore.distance && (
                    <Text variant="bodyMedium" style={styles.distanceText}>
                      📍 {Math.round(matchScore.distance || 0)} km away
                    </Text>
                  )}
                </>
              ) : (
                <Text variant="bodyMedium" style={styles.noLocationText}>
                  Location not specified
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        {!isCurrentUser && (
          <View style={styles.actions}>
            {existingChat ? (
              <Button
                mode="contained"
                onPress={handleGoToChat}
                style={styles.sayHiButton}
                contentStyle={styles.buttonContent}
                icon="message"
              >
                Go to Chat
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleSayHi}
                loading={sayHiMutation.isPending}
                disabled={sayHiMutation.isPending}
                style={styles.sayHiButton}
                contentStyle={styles.buttonContent}
                icon="send"
              >
                Say Hi
              </Button>
            )}
          </View>
        )}

        {isCurrentUser && (
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => router.push('/profile/edit')}
              style={styles.editButton}
              contentStyle={styles.buttonContent}
            >
              Edit Profile
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    flex: 1,
  },
  matchScoreContainer: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  matchScore: {
    fontWeight: 'bold',
    color: '#6200ea',
  },
  matchLabel: {
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bio: {
    lineHeight: 24,
    color: '#333',
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyChip: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sharedHobbyChip: {
    backgroundColor: '#4CAF50',
  },
  sharedHobbyText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sharedHobbiesText: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  noHobbiesText: {
    color: '#999',
    fontStyle: 'italic',
  },
  locationText: {
    color: '#333',
    fontWeight: '500',
  },
  distanceText: {
    marginTop: 8,
    color: '#6200ea',
    fontWeight: '600',
  },
  locationNote: {
    marginTop: 4,
    color: '#666',
    fontStyle: 'italic',
  },
  noLocationText: {
    color: '#999',
    fontStyle: 'italic',
  },
  debugText: {
    color: '#ff6b6b',
    fontSize: 10,
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
  },
  sayHiButton: {
    borderRadius: 8,
  },
  whatsappButton: {
    borderRadius: 8,
  },
  editButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#666',
    width: 100,
    marginRight: 12,
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  // Photo carousel styles
  photoCarousel: {
    alignItems: 'center',
    marginBottom: 16,
    height: 300,
  },
  photoList: {
    width: screenWidth - 32, // Account for padding
  },
  photoContainer: {
    width: screenWidth - 32,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoImage: {
    width: screenWidth - 64,
    height: 280,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  avatarBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6200ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  avatarBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  activeIndicator: {
    backgroundColor: '#6200ea',
  },
  noPhotoContainer: {
    width: screenWidth - 64,
    height: 280,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  noPhotoText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
});
