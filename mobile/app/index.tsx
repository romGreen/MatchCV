import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, Button, Card, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { authService } from '../lib/auth';
import { AuthUser } from '@matchcv/shared';
// import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function MainScreen() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Main screen - Focus effect triggered');
      setRefreshKey(prev => prev + 1);
      checkAuthStatus();
    }, [])
  );

  // Redirect to welcome screen if not logged in
  useEffect(() => {
    if (!loading && !currentUser) {
      console.log('Main screen - No current user, redirecting to welcome');
      router.replace('/welcome');
    }
  }, [loading, currentUser]);

  const checkAuthStatus = async () => {
    try {
      console.log('Main screen - Checking auth status...');
      const user = await authService.getCurrentUser();
      console.log('Main screen - User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('Main screen - User email:', user.email);
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    router.push('/profile/edit');
  };

  const handleDiscover = () => {
    router.push('/discover');
  };


  const handleSettings = () => {
    router.push('/settings');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text variant="titleLarge">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If not logged in, show loading while redirecting
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text variant="titleLarge">Redirecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Main screen - Current user exists:', currentUser.email);

  return (
    <SafeAreaView key={refreshKey} style={styles.container} edges={['left', 'right']}>
      <View style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.welcomeSection}>
              <Text variant="headlineMedium" style={styles.welcomeTitle}>
                Welcome back!
              </Text>
              <Text variant="titleMedium" style={styles.welcomeSubtitle}>
                {currentUser.profile?.displayName || currentUser.email}
              </Text>
            </View>
            
            {/* Quick stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text variant="headlineSmall" style={styles.statNumber}>5</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Nearby Matches</Text>
              </View>
              <View style={styles.statCard}>
                <Text variant="headlineSmall" style={styles.statNumber}>3</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Shared Hobbies</Text>
              </View>
            </View>
          </View>

          {/* Main actions */}
          <View style={styles.actionsSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Connect & Discover
            </Text>
            
            <View style={styles.actionCards}>
              <Card style={styles.actionCard} onPress={handleDiscover}>
                <Card.Content style={styles.actionCardContent}>
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionEmoji}>🧲</Text>
                  </View>
                  <View style={styles.actionText}>
                    <Text variant="titleMedium" style={styles.actionTitle}>
                      Discover Matches
                    </Text>
                    <Text variant="bodyMedium" style={styles.actionDescription}>
                      Find people with similar interests nearby
                    </Text>
                  </View>
                  <View style={styles.actionArrow}>
                    <Text style={styles.arrow}>→</Text>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.actionCard} onPress={handleCreateProfile}>
                <Card.Content style={styles.actionCardContent}>
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionEmoji}>✨</Text>
                  </View>
                  <View style={styles.actionText}>
                    <Text variant="titleMedium" style={styles.actionTitle}>
                      Edit Profile
                    </Text>
                    <Text variant="bodyMedium" style={styles.actionDescription}>
                      Update your hobbies and interests
                    </Text>
                  </View>
                  <View style={styles.actionArrow}>
                    <Text style={styles.arrow}>→</Text>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            
            <View style={styles.quickActionButtons}>
              <Button
                mode="outlined"
                onPress={handleSettings}
                style={styles.quickButton}
                contentStyle={styles.quickButtonContent}
                labelStyle={styles.quickButtonLabel}
                icon="cog"
              >
                Settings
              </Button>
            </View>
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#7F8C8D',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    color: '#7F8C8D',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  actionCards: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  actionDescription: {
    color: '#7F8C8D',
    lineHeight: 20,
  },
  actionArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 100,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    borderRadius: 12,
  },
  quickButtonContent: {
    paddingVertical: 8,
  },
  quickButtonLabel: {
    fontSize: 14,
  },
});