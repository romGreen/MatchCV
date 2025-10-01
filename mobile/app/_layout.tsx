import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { authService } from '../lib/auth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize auth service on app start
    authService.initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6200ea',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'MatchCV',
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="auth/login" 
              options={{ 
                title: 'Sign In',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="auth/register" 
              options={{ 
                title: 'Sign Up',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="profile/edit" 
              options={{ 
                title: 'Edit Profile',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="profile/[id]" 
              options={{ 
                title: 'Profile',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="chat/[chatId]" 
              options={{ 
                title: 'Chat',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="welcome" 
              options={{ 
                title: 'Welcome',
                headerShown: false
              }} 
            />
          </Stack>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
