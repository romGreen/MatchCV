import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '../lib/auth';
import { AuthUser } from '@matchcv/shared';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const user = await authService.getCurrentUser();
      
      if (!user) {
        // No user logged in, go to welcome
        router.replace('/welcome');
      } else if (user.profile) {
        // User has profile, go directly to discover
        router.replace('/(tabs)/discover');
      } else {
        // User logged in but no profile, go to profile edit
        router.replace('/profile/edit');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // On error, go to welcome
      router.replace('/welcome');
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while checking auth
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text variant="headlineSmall" style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6200ea',
    fontWeight: 'bold',
  },
});
