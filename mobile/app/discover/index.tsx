import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Text, Card, Button, Chip, FAB, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { NearbyUser, AuthUser } from '@matchcv/shared';
import { locationService } from '@/lib/location';

export default function DiscoverScreen() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);

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
  const { data: nearbyUsersData, isLoading, refetch } = useQuery({
    queryKey: ['nearby-users', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.profile) return null;
      
      // Try to get real location first
      let userLocation = { latitude: 31.9293, longitude: 34.7987 }; // Fallback to Nes Ziona
      
      try {
        const hasPermission = await locationService.requestLocationPermission();
        if (hasPermission) {
          const realLocation = await locationService.getCurrentLocation();
          if (realLocation) {
            userLocation = realLocation;
            setCurrentLocation(realLocation); // Store in state for map
            console.log('Using real GPS location:', userLocation);
            
            // Save real location to backend
            await apiService.updateLocation(userLocation.latitude, userLocation.longitude);
          }
        }
      } catch (error) {
        console.log('Could not get real location, using fallback:', error);
      }
      
      // Convert AuthUser to UserProfile format
      const userProfile = {
        id: currentUser.id,
        displayName: currentUser.profile.displayName,
        bio: currentUser.profile.bio,
        avatarUrl: currentUser.profile.avatarUrl,
        hobbies: currentUser.profile.hobbies,
        location: userLocation,
        visibilityLevel: currentUser.profile.visibilityLevel,
        matchRadius: currentUser.profile.matchRadius || 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return apiService.getNearbyUsers(userProfile, currentUser.profile.matchRadius || 10);
    },
    enabled: !!currentUser?.profile,
  });

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
      <Card.Content style={styles.cardContent}>
        {/* Match score badge */}
        <View style={styles.matchBadge}>
          <Text variant="titleMedium" style={styles.matchScore}>
            {item.matchScore.score}%
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.profile.avatarUrl || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.userDetails}>
            <Text variant="titleLarge" style={styles.userName}>
              {item.profile.displayName}
            </Text>
            <Text variant="bodyMedium" style={styles.bio} numberOfLines={2}>
              {item.profile.bio}
            </Text>
            
            {/* Distance and shared hobbies */}
            <View style={styles.connectionInfo}>
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceIcon}>📍</Text>
                <Text variant="bodySmall" style={styles.distance}>
                  {locationService.formatDistance(item.matchScore.distance)}
                </Text>
              </View>
              <View style={styles.sharedInfo}>
                <Text style={styles.sharedIcon}>🧲</Text>
                <Text variant="bodySmall" style={styles.sharedHobbies}>
                  {item.matchScore.sharedHobbies.length} shared
                </Text>
              </View>
            </View>
            
            {/* Hobbies */}
            <View style={styles.hobbiesContainer}>
              {item.profile.hobbies.slice(0, 3).map((hobby) => (
                <View key={hobby.id} style={styles.hobbyTag}>
                  <Text style={styles.hobbyText}>{hobby.name}</Text>
                </View>
              ))}
              {item.profile.hobbies.length > 3 && (
                <View style={styles.hobbyTag}>
                  <Text style={styles.hobbyText}>+{item.profile.hobbies.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Connection button */}
        <View style={styles.connectionButton}>
          <Text style={styles.connectionText}>Connect</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderMapView = () => {
    // Use the current location from state, or fallback to Nes Ziona
    const userLocation = currentLocation || { latitude: 31.9293, longitude: 34.7987 };
    
    if (!userLocation) {
      return (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge">Location not available</Text>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            Enable location to see matches on the map
          </Text>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Current user marker */}
        <Marker
          coordinate={userLocation}
          title="You"
          pinColor="blue"
        />
        
        {/* Nearby users markers */}
        {nearbyUsersData?.data?.users.map((user) => (
          <Marker
            key={user.profile.id}
            coordinate={user.profile.location!}
            title={user.profile.displayName}
            description={`${user.matchScore.score}% match`}
            onPress={() => setSelectedUser(user)}
          />
        ))}
      </MapView>
    );
  };

  const renderListView = () => {
    if (isLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Finding nearby matches...</Text>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
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
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'map' | 'list')}
          buttons={[
            { value: 'list', label: 'List' },
            { value: 'map', label: 'Map' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.content}>
        {viewMode === 'map' ? renderMapView() : renderListView()}
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bio: {
    color: '#666',
    fontSize: 13,
    marginBottom: 8,
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
    fontSize: 12,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 6,
  },
  hobbyTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hobbyText: {
    fontSize: 12,
    color: '#555',
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
});
