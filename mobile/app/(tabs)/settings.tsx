import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { authService } from '@/lib/auth';
import { apiService } from '@/lib/api';
import { AuthUser, ProfileFormData } from '@matchcv/shared';

export default function SettingsTabScreen() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load current user
  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser(true); // Force refresh
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              router.replace('/welcome');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Attempting to delete account...');
              const response = await apiService.deleteMyAccount();
              
              if (response.success) {
                console.log('Account deleted successfully');
                Alert.alert('Account Deleted', 'Your account has been deleted.');
                await authService.logout();
                router.replace('/welcome');
              } else {
                console.error('Delete account failed:', response.error);
                Alert.alert('Error', response.error || 'Failed to delete account. Please try again.');
              }
            } catch (error) {
              console.error('Delete account failed:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
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
            Please log in to access settings
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Settings
          </Text>
        </View>

        {/* Account Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account
            </Text>
            <List.Item
              title="Edit Profile"
              description="Update your profile information"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/profile/edit')}
            />
            <Divider />
            <List.Item
              title="Privacy Settings"
              description="Manage your privacy and location settings"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigate to privacy settings
                Alert.alert('Privacy Settings', 'Privacy settings coming soon!');
              }}
            />
            <Divider />
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => <List.Icon {...props} icon="lock-reset" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Change Password', 'Password change coming soon!');
              }}
            />
          </Card.Content>
        </Card>

        {/* Preferences Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Preferences
            </Text>
            <List.Item
              title="Notifications"
              description="Receive match notifications"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* App Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              App
            </Text>
            <List.Item
              title="About"
              description="App version and information"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert(
                  'About MatchCV',
                  'MatchCV v1.0.0\n\nConnect with people who share your hobbies and interests in your area.',
                  [{ text: 'OK' }]
                );
              }}
            />
            <Divider />
            <List.Item
              title="Help & Support"
              description="Get help and contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Help & Support', 'Support coming soon!');
              }}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              description="Read our terms and conditions"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Terms of Service', 'Terms of service coming soon!');
              }}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Privacy Policy', 'Privacy policy coming soon!');
              }}
            />
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, styles.dangerCard]}>
          <Card.Content>
            
            <List.Item
              title="Logout"
              description="Sign out of your account"
              left={(props) => <List.Icon {...props} icon="logout" color="#ff6b6b" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleLogout}
              titleStyle={styles.dangerText}
            />
            <Divider />
            <List.Item
              title="Delete Account"
              description="Permanently delete your account"
              left={(props) => <List.Icon {...props} icon="delete-forever" color="#ff6b6b" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleDeleteAccount}
              titleStyle={styles.dangerText}
            />
          </Card.Content>
        </Card>

        {/* User Info */}
        <Card style={styles.userInfoCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.userInfoText}>
              Logged in as: {currentUser.email}
            </Text>
            <Text variant="bodySmall" style={styles.userInfoText}>
              User ID: {currentUser.id}
            </Text>
          </Card.Content>
        </Card>
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
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    backgroundColor: '#fff',
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dangerText: {
    color: '#ff6b6b',
  },
  userInfoCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 15,
    elevation: 1,
    backgroundColor: '#f8f9fa',
  },
  userInfoText: {
    color: '#666',
    marginBottom: 4,
  },
});
