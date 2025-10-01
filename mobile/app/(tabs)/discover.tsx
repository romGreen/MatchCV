import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Text, Card, Button, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { NearbyUser, AuthUser } from '@matchcv/shared';

export default function DiscoverScreen() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [loading, setLoading] = useState(true);


  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        setIsLocationEnabled(true); // Enable location for now
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Fetch nearby users
  const { data: nearbyUsersData, isLoading, error, refetch } = useQuery({
    queryKey: ['nearby-users', currentUser?.id, currentUser?.profile?.matchRadius],
    queryFn: async () => {
      if (!currentUser?.profile) return null;
      
      // No need to track exact coordinates - just use the discovery API
      // which will handle location-based matching on the backend
      
      // Convert AuthUser to UserProfile format
      const userProfile = {
        id: currentUser.id,
        displayName: currentUser.profile.displayName,
        bio: currentUser.profile.bio,
        avatarUrl: currentUser.profile.photos?.[0]?.photoUrl,
        hobbies: currentUser.profile.hobbies,
        location: currentUser.profile.location, // Use the location from the user's profile
        useLocation: currentUser.profile.useLocation ?? true,
        matchRadius: currentUser.profile.matchRadius || 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Call the discovery API with the user's actual match radius
      return await apiService.getNearbyUsers(userProfile, currentUser.profile.matchRadius || 10);
    },
    enabled: !!currentUser?.profile,
  });

  // Refresh discovery data when screen comes into focus (e.g., after profile edit)
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser?.profile) {
        refetch();
      }
    }, [currentUser?.profile, refetch])
  );

  // Location permission check - simplified for now
  useEffect(() => {
    if (currentUser) {
      // For now, just set location as enabled to allow matching
      setIsLocationEnabled(true);
    }
  }, [currentUser]);

  const handleUserPress = (user: NearbyUser) => {
    router.push(`/profile/${user.profile.id}`);
  };

  const renderUserCard = ({ item }: { item: NearbyUser }) => (
    <Card style={styles.userCard} onPress={() => handleUserPress(item)}>
      <View style={styles.cardContentWrapper}>
        <Card.Content style={styles.cardContent}>
        {/* Match score badge */}
        <View style={styles.matchBadge}>
          <Text variant="titleMedium" style={styles.matchScore}>
            {item.matchScore?.score || 0}%
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {item.profile.photos?.[0]?.photoUrl ? (
              <Image source={{ uri: item.profile.photos[0].photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.noPhotoAvatar}>
                <Text style={styles.noPhotoAvatarText}>No Photo</Text>
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text variant="titleLarge" style={styles.userName}>
              {item.profile.displayName}
            </Text>
            
            {/* Shared hobbies count */}
            <View style={styles.connectionInfo}>
              <View style={styles.sharedInfo}>
                
                <Text variant="titleLarge" style={styles.sharedHobbies}>
                  {item.matchScore?.sharedHobbies?.length || 0} shared hobbies
                </Text>
              </View>
            </View>
          </View>
        </View>
        </Card.Content>
      </View>
    </Card>
  );


  const renderListView = () => {
    if (isLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Finding nearby matches...</Text>
        </View>
      );
    }

    // Handle location error
    if (error) {
      const errorMessage = error.message || 'Failed to fetch nearby users';
      const isLocationError = errorMessage.includes('location not available');
      
      return (
        <View style={styles.emptyState}>
          <Text variant="titleLarge">Location Required</Text>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            {isLocationError 
              ? 'Please update your location in profile settings to discover nearby users.'
              : 'Unable to find nearby users. Please try again.'
            }
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/profile/edit')}
            style={styles.emptyStateButton}
          >
            Update Location
          </Button>
          <Button
            mode="outlined"
            onPress={() => refetch()}
            style={[styles.emptyStateButton, { marginTop: 8 }]}
          >
            Try Again
          </Button>
        </View>
      );
    }

    if (!nearbyUsersData?.data?.users.length) {
      return (
        <View style={styles.emptyState}>
          <Text variant="titleLarge">No matches found</Text>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            Try adding more hobbies to your profile or check back later for new neighbors!
          </Text>
          <Button
            mode="outlined"
            onPress={() => router.push('/profile/edit')}
            style={styles.emptyStateButton}
          >
            Edit Profile
          </Button>
        </View>
      );
    }

    return (
      <FlatList
        data={nearbyUsersData.data.users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.profile.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.emptyState}>
          <Text variant="titleLarge">Create your profile first</Text>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            You need to create a profile before discovering matches
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/profile/edit')}
            style={styles.emptyStateButton}
          >
            Create Profile
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Discover Matches
        </Text>
      </View>
      <View style={styles.content}>
        {renderListView()}
      </View>

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={() => refetch()}
        label="Refresh"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  segmentedButtons: {
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f0f0f0',
  },
  webMapTitle: {
    marginBottom: 16,
    color: '#6200ea',
    fontWeight: 'bold',
  },
  webMapText: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },
  switchToListButton: {
    borderRadius: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    backgroundColor: '#fff',
  },
  cardContentWrapper: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#6200ea',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 1,
  },
  matchScore: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#6200ea',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 15,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  distance: {
    color: '#666',
    fontSize: 12,
  },
  sharedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  sharedHobbies: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
  },
  connectionButton: {
    backgroundColor: '#6200ea',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 15,
  },
  connectionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  noPhotoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  noPhotoAvatarText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
});
