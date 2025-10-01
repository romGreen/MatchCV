import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, Chip, FAB, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { AuthUser } from '@matchcv/shared';

export default function ProfileTabScreen() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Force refresh to get latest photos
        const user = await authService.getCurrentUser(true);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Refresh user data when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      const refreshUser = async () => {
        try {
          const user = await authService.getCurrentUser(true);
          setCurrentUser(user);
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      };
      refreshUser();
    }, [])
  );

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleViewProfile = () => {
    if (currentUser?.profile?.id) {
      router.push(`/profile/${currentUser.profile.id}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loading}>
          <Text variant="titleLarge">Loading...</Text>
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
            Please log in to view your profile
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

  if (!currentUser.profile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.emptyState}>
          <Text variant="titleLarge">Create your profile</Text>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            You need to create a profile to start matching
          </Text>
          <Button
            mode="contained"
            onPress={handleEditProfile}
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            My Profile
          </Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ 
                    uri: currentUser.profile.photos?.[0]?.photoUrl 
                  }} 
                  style={styles.avatar} 
                />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.displayName}>
                  {currentUser.profile.displayName}
                </Text>
                
              </View>
            </View>

            {currentUser.profile.bio && (
              <View style={styles.bioSection}>
                <Text variant="bodyLarge" style={styles.bio}>
                  {currentUser.profile.bio}
                </Text>
              </View>
            )}

            {/* Hobbies */}
            <View style={styles.hobbiesSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                My Hobbies
              </Text>
              <View style={styles.hobbiesContainer}>
                {currentUser.profile.hobbies.map((hobby) => (
                  <Chip 
                    key={hobby.id} 
                    mode="outlined" 
                    style={styles.hobbyChip}
                    textStyle={styles.hobbyText}
                  >
                    {hobby.name}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Location Info */}
            <View style={styles.locationSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Location
              </Text>
              <View style={styles.locationInfo}>
                <Text variant="bodyLarge" style={styles.locationText}>
                  {currentUser.profile.city && currentUser.profile.country
                    ? `${currentUser.profile.city}, ${currentUser.profile.country}`
                    : 'Location not set - please update in Edit Profile'}
                </Text>
                <Text variant="bodySmall" style={styles.locationSubtext}>
                  {currentUser.profile.useLocation 
                    ? 'Auto-detected location • Radius: ' + (currentUser.profile.matchRadius || 10) + 'km'
                    : 'Manual location • Radius: ' + (currentUser.profile.matchRadius || 10) + 'km'}
                </Text>
              </View>
            </View>

            {/* Optional Profile Information */}
            {(currentUser.profile.age || currentUser.profile.job || currentUser.profile.company || 
              currentUser.profile.education || currentUser.profile.university || 
              currentUser.profile.relationshipStatus || currentUser.profile.lookingFor || 
              currentUser.profile.interests || currentUser.profile.languages || 
              currentUser.profile.height || currentUser.profile.lifestyle) && (
              <View style={styles.optionalSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  About Me
                </Text>
                <View style={styles.optionalFieldsContainer}>
                  {currentUser.profile.age && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Age</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.age}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.height && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Height</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.height} cm</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.job && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Job</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.job}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.company && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Company</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.company}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.education && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Education</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.education}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.university && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>University</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.university}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.relationshipStatus && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Relationship Status</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.relationshipStatus}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.lookingFor && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Looking For</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.lookingFor}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.languages && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Languages</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.languages}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.interests && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Interests</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.interests}</Text>
                    </View>
                  )}
                  
                  {currentUser.profile.lifestyle && (
                    <View style={styles.optionalField}>
                      <Text variant="bodySmall" style={styles.optionalFieldLabel}>Lifestyle</Text>
                      <Text variant="bodyLarge" style={styles.optionalFieldValue}>{currentUser.profile.lifestyle}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Button
            mode="contained"
            onPress={handleEditProfile}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            icon="pencil"
          >
            Edit Profile
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleViewProfile}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            icon="eye"
          >
            View Public Profile
          </Button>
        </View>
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
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    margin: 16,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    backgroundColor: '#fff',
  },
  profileContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#6200ea',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    color: '#666',
    marginBottom: 8,
  },
  bioSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bio: {
    color: '#555',
    lineHeight: 24,
  },
  hobbiesSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyChip: {
    marginBottom: 8,
  },
  hobbyText: {
    fontSize: 12,
  },
  locationSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    color: '#333',
    fontWeight: '500',
  },
  locationSubtext: {
    color: '#666',
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // Optional fields styles
  optionalSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  optionalFieldsContainer: {
    marginTop: 12,
  },
  optionalField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionalFieldLabel: {
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  optionalFieldValue: {
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
});
