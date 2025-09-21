import React from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@/store/session';
import { apiService } from '@/lib/api';
import { locationService } from '@/lib/location';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useSessionStore();

  // Fetch user profile
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => apiService.getUserProfile(id!),
    enabled: !!id,
  });

  // Send "Say hi" mutation
  const sayHiMutation = useMutation({
    mutationFn: (toUserId: string) => 
      apiService.sendSayHiMessage(toUserId, currentUser?.id || ''),
    onSuccess: () => {
      Alert.alert(
        'Message Sent!',
        'Your "Say hi" message has been sent. In a real app, this would open a chat or WhatsApp.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      console.error('Say hi error:', error);
    },
  });

  const handleSayHi = () => {
    if (!id || !currentUser) return;
    
    Alert.alert(
      'Say Hi',
      'This will send a friendly message to start a conversation. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => sayHiMutation.mutate(id) }
      ]
    );
  };

  const handleWhatsApp = () => {
    // In a real app, you might have the user's phone number
    // For now, we'll just show an alert
    Alert.alert(
      'WhatsApp',
      'In a real app, this would open WhatsApp with a pre-filled message.',
      [{ text: 'OK' }]
    );
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
  const isCurrentUser = currentUser?.id === user.id;

  // Calculate match score if not current user
  let matchScore = null;
  if (!isCurrentUser && currentUser) {
    const sharedHobbies = user.hobbies.filter(hobby1 => 
      currentUser.hobbies.some(hobby2 => hobby2.id === hobby1.id)
    ).length;
    
    const totalHobbies = Math.max(user.hobbies.length, currentUser.hobbies.length);
    const distance = user.location && currentUser.location 
      ? locationService.calculateDistance(user.location, currentUser.location)
      : 0;
    
    let score = (sharedHobbies / totalHobbies) * 100;
    const distancePenalty = Math.min(distance / 5 * 10, 50);
    score = Math.max(score - distancePenalty, 0);
    
    matchScore = {
      sharedHobbies,
      totalHobbies,
      distance,
      score: Math.round(score),
    };
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {user.displayName}
              </Text>
              {matchScore && (
                <View style={styles.matchScoreContainer}>
                  <Text variant="titleLarge" style={styles.matchScore}>
                    {matchScore.score}%
                  </Text>
                  <Text variant="bodySmall" style={styles.matchLabel}>
                    Match
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Bio */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyLarge" style={styles.bio}>
              {user.bio}
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
              {user.hobbies.map((hobby) => {
                const isShared = currentUser?.hobbies.some(h => h.id === hobby.id);
                return (
                  <Chip
                    key={hobby.id}
                    style={[
                      styles.hobbyChip,
                      isShared && styles.sharedHobbyChip
                    ]}
                    textStyle={isShared ? styles.sharedHobbyText : undefined}
                  >
                    {hobby.name}
                    {isShared && ' ✓'}
                  </Chip>
                );
              })}
            </View>
            {matchScore && (
              <Text variant="bodySmall" style={styles.sharedHobbiesText}>
                {matchScore.sharedHobbies} shared hobbies
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Location & Distance */}
        {user.location && matchScore && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Location
              </Text>
              <Text variant="bodyLarge">
                {locationService.formatDistance(matchScore.distance)} away
              </Text>
              <Text variant="bodySmall" style={styles.locationNote}>
                Location shown as {user.visibilityLevel === 'precise' ? 'precise' : 'approximate'}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        {!isCurrentUser && (
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSayHi}
              loading={sayHiMutation.isPending}
              disabled={sayHiMutation.isPending}
              style={styles.sayHiButton}
              contentStyle={styles.buttonContent}
            >
              Say Hi
            </Button>
            <Button
              mode="outlined"
              onPress={handleWhatsApp}
              style={styles.whatsappButton}
              contentStyle={styles.buttonContent}
            >
              WhatsApp
            </Button>
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
    paddingBottom: 0,
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
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  matchScoreContainer: {
    alignItems: 'center',
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
  },
  sharedHobbyChip: {
    backgroundColor: '#e8f5e8',
  },
  sharedHobbyText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  sharedHobbiesText: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  locationNote: {
    marginTop: 4,
    color: '#666',
    fontStyle: 'italic',
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
});
