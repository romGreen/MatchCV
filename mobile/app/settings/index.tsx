import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Card, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '../../lib/auth';
import { apiService } from '../../lib/api';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const theme = useTheme();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await authService.logout();
              Alert.alert('Success', 'Logged out successfully!', [
                { text: 'OK', onPress: () => router.replace('/') }
              ]);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including your profile, hobbies, and matches.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account and all data. Type "DELETE" to confirm.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleteLoading(true);
                    try {
                      const response = await apiService.deleteMyAccount();
                      if (response.success) {
                        // Clear auth data immediately
                        console.log('Settings - Clearing auth data...');
                        await authService.logout();
                        console.log('Settings - Auth data cleared, navigating to welcome');
                        
                        Alert.alert(
                          'Account Deleted',
                          'Your account has been permanently deleted.',
                          [
                            { 
                              text: 'OK', 
                                onPress: () => {
                                  // Navigate to welcome screen
                                  console.log('Settings - Navigating to welcome screen');
                                  router.replace('/welcome');
                                }
                            }
                          ]
                        );
                      } else {
                        Alert.alert('Error', response.error || 'Failed to delete account');
                      }
                    } catch (error) {
                      console.error('Delete account error:', error);
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    } finally {
                      setDeleteLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Actions
            </Text>
            <Text variant="bodyMedium" style={styles.sectionDescription}>
              Manage your account and data
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleLogout}
                loading={loading}
                disabled={loading || deleteLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                icon="logout"
              >
                Logout
              </Button>

              <Button
                mode="contained"
                onPress={handleDeleteAccount}
                loading={deleteLoading}
                disabled={loading || deleteLoading}
                style={[styles.button, styles.deleteButton]}
                contentStyle={styles.buttonContent}
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                icon="delete-forever"
              >
                Delete Account
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              App Information
            </Text>
            <Text variant="bodyMedium" style={styles.sectionDescription}>
              MatchCV v1.0.0
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Find nearby people with similar hobbies
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Privacy & Data
            </Text>
            <Text variant="bodyMedium" style={styles.sectionDescription}>
              Your data is stored securely and only used to find hobby matches. You can delete your account at any time.
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#6200ea',
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 8,
    color: '#333',
    fontWeight: '600',
  },
  sectionDescription: {
    marginBottom: 16,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
  deleteButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
