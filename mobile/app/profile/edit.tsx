import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, PanResponder, Animated, Dimensions } from 'react-native';
import { Text, TextInput, Button, Card, Chip, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { ProfileFormData, VisibilityLevel, AuthUser } from '@matchcv/shared';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(200, 'Bio must be less than 200 characters'),
  hobbies: z.array(z.string()).min(1, 'Select at least one hobby'),
  visibilityLevel: z.enum(['precise', 'neighborhood', 'hidden']),
  matchRadius: z.number().min(1).max(100).optional(),
});

// Custom Slider Component
interface CustomSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  style?: any;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 100,
  step = 1,
  style,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  const sliderWidth = screenWidth - 80; // Account for padding
  const thumbSize = 24;
  const trackWidth = sliderWidth - thumbSize; // Available space for thumb movement
  
  const pan = useRef(new Animated.Value(
    ((value - minimumValue) / (maximumValue - minimumValue)) * trackWidth
  )).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset((pan as any)._value);
      },
      onPanResponderMove: (evt: any, gestureState: any) => {
        const newValue = Math.max(0, Math.min(trackWidth, gestureState.dx + (pan as any)._offset));
        pan.setValue(newValue);
        
        const percentage = newValue / trackWidth;
        const sliderValue = Math.round((minimumValue + percentage * (maximumValue - minimumValue)) / step) * step;
        const clampedValue = Math.max(minimumValue, Math.min(maximumValue, sliderValue));
        onValueChange(clampedValue);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Update pan position when value changes externally
  useEffect(() => {
    const newPosition = ((value - minimumValue) / (maximumValue - minimumValue)) * trackWidth;
    pan.setValue(newPosition);
  }, [value, minimumValue, maximumValue, trackWidth, pan]);

  // Calculate progress bar width to align with thumb center
  const progressPercentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
  const progressWidth = (progressPercentage / 100) * sliderWidth;

  return (
    <View style={[styles.sliderContainer, style]}>
      <View style={styles.sliderTrack}>
        <View 
          style={[
            styles.sliderProgress, 
            { 
              width: progressWidth
            }
          ]} 
        />
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: pan }],
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{minimumValue}km</Text>
        <Text style={styles.sliderLabel}>{maximumValue}km</Text>
      </View>
    </View>
  );
};

export default function EditProfileScreen() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [matchRadius, setMatchRadius] = useState(10);

  // Load current user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setUserLoading(false);
      }
    };
    loadUser();
  }, []);

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      hobbies: [],
      visibilityLevel: 'neighborhood',
      matchRadius: 10,
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (currentUser?.profile) {
      const userHobbies = currentUser.profile.hobbies?.map(h => h.name) || [];
      console.log('Current user profile:', currentUser.profile); // Debug log
      console.log('User hobbies from profile:', currentUser.profile.hobbies); // Debug log
      console.log('Mapped hobby names:', userHobbies); // Debug log
      
      reset({
        displayName: currentUser.profile.displayName || '',
        bio: currentUser.profile.bio || '',
        hobbies: userHobbies,
        visibilityLevel: currentUser.profile.visibilityLevel || 'neighborhood',
        matchRadius: currentUser.profile.matchRadius || 10,
      });
      setSelectedHobbies(userHobbies);
      setMatchRadius(currentUser.profile.matchRadius || 10); // Set the slider state
      console.log('Form reset with hobbies:', userHobbies); // Debug log
    }
  }, [currentUser, reset]);

  const watchedHobbies = watch('hobbies');

  // Fetch available hobbies
  const { data: hobbiesData, isLoading: hobbiesLoading } = useQuery({
    queryKey: ['hobbies'],
    queryFn: () => apiService.getHobbies(),
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiService.saveUserProfile(data, currentUser?.id),
    onSuccess: async (response) => {
      console.log('Save profile response:', response);
      if (response.success) {
        // Refresh user data from auth service with force refresh
        const updatedUser = await authService.getCurrentUser(true);
        console.log('Updated user after save:', updatedUser);
        setCurrentUser(updatedUser);
        queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
        Alert.alert('Success', 'Profile saved successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to save profile');
      }
    },
    onError: (error) => {
      console.error('Save profile error:', error);
      Alert.alert('Error', `Failed to save profile: ${error.message || 'Unknown error'}`);
    },
  });


  const toggleHobby = (hobbyName: string) => {
    const newHobbies = selectedHobbies.includes(hobbyName)
      ? selectedHobbies.filter(h => h !== hobbyName)
      : [...selectedHobbies, hobbyName];
    
    console.log('Toggling hobby:', hobbyName); // Debug log
    console.log('Current selected hobbies:', selectedHobbies); // Debug log
    console.log('New selected hobbies:', newHobbies); // Debug log
    
    setSelectedHobbies(newHobbies);
    setValue('hobbies', newHobbies);
  };

  const onSubmit = (data: ProfileFormData) => {
    console.log('=== ONSUBMIT FUNCTION CALLED ===');
    console.log('Form data:', data);
    console.log('Selected hobbies:', selectedHobbies);
    console.log('Form errors:', errors);
    saveProfileMutation.mutate(data);
  };

  const handleLocationPermission = async () => {
    try {
      Alert.alert(
        'Location Enabled',
        'Your location will be used to find nearby matches. You can adjust privacy settings below.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to enable location. Please try again.');
    }
  };

  if (hobbiesLoading || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Basic Information
            </Text>
            
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Display Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.displayName}
                  style={styles.input}
                />
              )}
            />
            {errors.displayName && (
              <Text variant="bodySmall" style={styles.error}>
                {errors.displayName.message}
              </Text>
            )}

            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Bio"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  error={!!errors.bio}
                  style={styles.input}
                />
              )}
            />
            {errors.bio && (
              <Text variant="bodySmall" style={styles.error}>
                {errors.bio.message}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Hobbies
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Select hobbies that interest you. This helps us find better matches.
            </Text>
            
            <View style={styles.hobbiesContainer}>
              {hobbiesData?.data?.map((hobby) => {
                const isSelected = selectedHobbies.includes(hobby.name);
                console.log(`Hobby ${hobby.name} is selected:`, isSelected); // Debug log
                return (
                  <Chip
                    key={hobby.id}
                    selected={isSelected}
                    onPress={() => toggleHobby(hobby.name)}
                    style={styles.hobbyChip}
                  >
                    {hobby.name}
                  </Chip>
                );
              })}
            </View>
            {errors.hobbies && (
              <Text variant="bodySmall" style={styles.error}>
                {errors.hobbies.message}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location & Privacy
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Control how precise your location is shared with other users.
            </Text>
            
            <Controller
              control={control}
              name="visibilityLevel"
              render={({ field: { onChange, value } }) => (
                <SegmentedButtons
                  value={value}
                  onValueChange={onChange}
                  buttons={[
                    { value: 'precise', label: 'Precise' },
                    { value: 'neighborhood', label: 'Neighborhood' },
                    { value: 'hidden', label: 'Hidden' },
                  ]}
                  style={styles.segmentedButtons}
                />
              )}
            />
            
            <View style={styles.radiusSection}>
              <Text variant="titleSmall" style={styles.radiusTitle}>
                Match Radius
              </Text>
              <Text variant="bodySmall" style={styles.radiusDescription}>
                How far to search for matches (1-100 km)
              </Text>
              <CustomSlider
                value={matchRadius}
                onValueChange={(value) => {
                  setMatchRadius(value);
                  setValue('matchRadius', value);
                }}
                minimumValue={1}
                maximumValue={100}
                step={1}
                style={styles.radiusSlider}
              />
              <Text style={styles.sliderValue}>Current: {Math.round(matchRadius)} km</Text>
            </View>
            
            <Button
              mode="outlined"
              onPress={handleLocationPermission}
              style={styles.locationButton}
            >
              Enable Location
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => {
              console.log('=== BUTTON PRESSED ===');
              console.log('Mutation pending:', saveProfileMutation.isPending);
              console.log('Mutation error:', saveProfileMutation.error);
              
              // Get form data directly and ensure matchRadius is included
              const formData = watch();
              formData.matchRadius = matchRadius; // Ensure matchRadius is included
              console.log('Form data from watch():', formData);
              console.log('Current matchRadius state:', matchRadius);
              
              // Call mutation directly
              console.log('Calling mutation directly...');
              saveProfileMutation.mutate(formData);
            }}
            loading={saveProfileMutation.isPending}
            disabled={saveProfileMutation.isPending}
            style={styles.saveButton}
          >
            Save Profile
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  sectionDescription: {
    marginBottom: 16,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 16,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyChip: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  locationButton: {
    marginTop: 8,
  },
  actions: {
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    borderRadius: 8,
  },
  // Slider styles
  sliderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sliderTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
    justifyContent: 'center',
  },
  sliderProgress: {
    height: 6,
    backgroundColor: '#6200ea',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#6200ea',
    borderRadius: 12,
    top: -9,
    left: -12, // Center the thumb on the track
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#fff',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ea',
    marginTop: 8,
    textAlign: 'center',
  },
  radiusSection: {
    marginVertical: 16,
  },
  radiusTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  radiusDescription: {
    color: '#666',
    marginBottom: 12,
  },
  radiusSlider: {
    marginTop: 8,
  },
});
