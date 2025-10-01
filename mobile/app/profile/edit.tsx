import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, PanResponder, Animated, Dimensions, Image, TouchableOpacity, Modal } from 'react-native';
import { Text, TextInput, Button, Card, Chip, SegmentedButtons, ActivityIndicator, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { locationService } from '@/lib/location';
import { ProfileFormData, AuthUser } from '@matchcv/shared';
import SearchablePicker from '@/components/SearchablePicker';
import { countries, citiesByCountry } from '@/data/locations';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(200, 'Bio must be less than 200 characters'),
  hobbies: z.array(z.string()).min(1, 'Select at least one hobby'),
  useLocation: z.boolean(),
  country: z.string().optional(),
  city: z.string().optional(),
  matchRadius: z.number().min(1).max(200),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Optional profile information
  age: z.number().min(18).max(100).optional(),
  job: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  university: z.string().max(100).optional(),
  relationshipStatus: z.string().max(50).optional(),
  lookingFor: z.string().max(200).optional(),
  interests: z.string().max(300).optional(),
  languages: z.string().max(200).optional(),
  height: z.number().min(100).max(250).optional(),
  lifestyle: z.string().max(200).optional(),
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
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [tempRadius, setTempRadius] = useState(10);
  const [selectedRadius, setSelectedRadius] = useState(10);

  // Photo management state
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hobby modal state
  const [showHobbyModal, setShowHobbyModal] = useState(false);
  const [hobbySearchQuery, setHobbySearchQuery] = useState('');

  // Load current user data
    const loadUser = async () => {
      try {
      const user = await authService.getCurrentUser(true); // Force refresh
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setUserLoading(false);
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

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      hobbies: [],
      useLocation: false,
      country: '',
      city: '',
      matchRadius: 10,
      latitude: undefined,
      longitude: undefined,
      // Optional profile information
      age: undefined,
      job: '',
      company: '',
      education: '',
      university: '',
      relationshipStatus: '',
      lookingFor: '',
      interests: '',
      languages: '',
      height: undefined,
      lifestyle: '',
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (currentUser?.profile) {
      const userHobbies = currentUser.profile.hobbies?.map(h => h.name) || [];
      
      console.log('Resetting form with user data:', {
        displayName: currentUser.profile.displayName,
        matchRadius: currentUser.profile.matchRadius,
        country: currentUser.profile.country,
        city: currentUser.profile.city,
        useLocation: currentUser.profile.useLocation ?? true,
        location: currentUser.profile.location,
        latitude: currentUser.profile.location?.latitude,
        longitude: currentUser.profile.location?.longitude
      });
      
      const formData = {
        displayName: currentUser.profile.displayName || '',
        bio: currentUser.profile.bio || '',
        hobbies: userHobbies,
        useLocation: currentUser.profile.useLocation ?? true, // Use stored preference or default to GPS
        country: currentUser.profile.country || '',
        city: currentUser.profile.city || '',
        matchRadius: currentUser.profile.matchRadius || 10,
        latitude: currentUser.profile.location?.latitude,
        longitude: currentUser.profile.location?.longitude,
        // Optional profile information
        age: currentUser.profile.age ?? undefined,
        job: currentUser.profile.job || '',
        company: currentUser.profile.company || '',
        education: currentUser.profile.education || '',
        university: currentUser.profile.university || '',
        relationshipStatus: currentUser.profile.relationshipStatus || '',
        lookingFor: currentUser.profile.lookingFor || '',
        interests: currentUser.profile.interests || '',
        languages: currentUser.profile.languages || '',
        height: currentUser.profile.height ?? undefined,
        lifestyle: currentUser.profile.lifestyle || '',
      };


      reset(formData);
      setSelectedHobbies(userHobbies);
      
      // Load existing photos
      if (currentUser.profile?.photos) {
        setPhotos(currentUser.profile.photos);
      }
      
      // Set country code for the picker
      const countryCode = Object.keys(citiesByCountry).find(code => 
        countries.find(c => c.value === code)?.label === currentUser.profile?.country
      );
      setSelectedCountryCode(countryCode || '');
    }
  }, [currentUser, reset]);

  const watchedHobbies = watch('hobbies');
  const useLocation = watch('useLocation');
  const country = watch('country');
  const city = watch('city');
  const matchRadius = watch('matchRadius');

  // Fetch available hobbies
  const { data: hobbiesData, isLoading: hobbiesLoading } = useQuery({
    queryKey: ['hobbies'],
    queryFn: () => apiService.getHobbies(),
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiService.saveUserProfile(data, currentUser?.id),
    onSuccess: async (response) => {
      if (response.success) {
        // Refresh user data from auth service with force refresh
        const updatedUser = await authService.getCurrentUser(true);
        console.log('Profile saved - updated user:', updatedUser);
        console.log('Profile saved - user photos:', updatedUser?.profile?.photos);
        setCurrentUser(updatedUser);
        queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        Alert.alert('Success', 'Profile saved successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/discover') }
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
    
    
    setSelectedHobbies(newHobbies);
    setValue('hobbies', newHobbies);
  };

  const onSubmit = (data: any) => {
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form data received in onSubmit:', data);
    console.log('Age field:', { value: data.age, type: typeof data.age });
    console.log('All form fields:', Object.keys(data));
    console.log('Form data values:', {
      age: data.age,
      job: data.job,
      company: data.company,
      education: data.education,
      university: data.university,
      relationshipStatus: data.relationshipStatus,
      lookingFor: data.lookingFor,
      interests: data.interests,
      languages: data.languages,
      height: data.height,
      lifestyle: data.lifestyle
    });
    console.log('useLocation value:', data.useLocation);
    console.log('country value:', data.country);
    console.log('city value:', data.city);
    console.log('matchRadius value:', data.matchRadius);
    console.log('latitude value:', data.latitude);
    console.log('longitude value:', data.longitude);
    
    // Transform the data to match the expected API format
    const profileData: ProfileFormData = {
      displayName: data.displayName,
      bio: data.bio,
      hobbies: data.hobbies,
      useLocation: data.useLocation, // Use the location preference
      country: data.country,
      city: data.city,
      matchRadius: data.matchRadius,
      latitude: data.useLocation ? data.latitude : undefined,
      longitude: data.useLocation ? data.longitude : undefined,
      // Optional profile information
      age: data.age,
      job: data.job,
      company: data.company,
      education: data.education,
      university: data.university,
      relationshipStatus: data.relationshipStatus,
      lookingFor: data.lookingFor,
      interests: data.interests,
      languages: data.languages,
      height: data.height,
      lifestyle: data.lifestyle,
    };
    
    console.log('=== PROFILE DATA BEING SENT ===');
    console.log('Profile data being sent to API:', profileData);
    console.log('Age in profileData:', { value: profileData.age, type: typeof profileData.age });
    console.log('Location data being sent:', {
      useLocation: profileData.useLocation,
      latitude: profileData.latitude,
      longitude: profileData.longitude,
      country: profileData.country,
      city: profileData.city
    });
    console.log('Form data coordinates:', { 
      latitude: data.latitude, 
      longitude: data.longitude,
      latitudeType: typeof data.latitude,
      longitudeType: typeof data.longitude,
      useLocation: data.useLocation,
      city: data.city,
      country: data.country
    });
    console.log('Optional fields being sent:', {
      age: data.age,
      job: data.job,
      company: data.company,
      education: data.education,
      university: data.university,
      relationshipStatus: data.relationshipStatus,
      lookingFor: data.lookingFor,
      interests: data.interests,
      languages: data.languages,
      height: data.height,
      lifestyle: data.lifestyle,
    });
    console.log('Location data being sent:', {
      latitude: data.latitude,
      longitude: data.longitude,
      country: data.country,
      city: data.city,
      useLocation: data.useLocation,
    });
    saveProfileMutation.mutate(profileData);
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


  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadPhoto = async (imageUri: string) => {
    setUploadingPhotos(true);
    try {
      const response = await apiService.uploadPhoto(imageUri);
      if (response.success) {
        // Add the new photo to the photos array
        const newPhoto = {
          id: response.data?.photoId,
          photoUrl: response.data?.photoUrl,
          order: photos.length, // This will be the correct order (0 for first photo)
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setPhotos(prev => [...prev, newPhoto]);
        console.log('Photo uploaded successfully:', newPhoto);
        // Invalidate cache to refresh public profile
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
        Alert.alert('Success', 'Photo uploaded successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to upload photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const response = await apiService.deletePhoto(photoId);
      if (response.success) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
        // Invalidate cache to refresh public profile
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
        Alert.alert('Success', 'Photo deleted successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to delete photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  };

  const movePhoto = async (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    
    // Update order values
    const updatedPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      order: index
    }));
    
    setPhotos(updatedPhotos);
    
    // Update order on server
    try {
      const photoOrders = updatedPhotos.map((photo, index) => ({
        photoId: photo.id,
        order: index
      }));
      
      await apiService.updatePhotoOrder(photoOrders);
      // Invalidate cache to refresh public profile
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
    } catch (error) {
      console.error('Failed to update photo order on server:', error);
      // Optionally show error to user
    }
  };

  const handlePhotoDragStart = (photoId: string) => {
    setDraggedPhoto(photoId);
  };

  const handlePhotoDragEnd = () => {
    setDraggedPhoto(null);
  };

  const handlePhotoDrop = (targetPhotoId: string) => {
    if (!draggedPhoto || draggedPhoto === targetPhotoId) return;
    
    const draggedIndex = photos.findIndex(p => p.id === draggedPhoto);
    const targetIndex = photos.findIndex(p => p.id === targetPhotoId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      movePhoto(draggedIndex, targetIndex);
    }
    setDraggedPhoto(null);
  };

  const handlePhotoLongPress = (photoId: string) => {
    setDraggedPhoto(photoId);
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePhotoDrag = (photoId: string, gestureState: any) => {
    if (draggedPhoto === photoId) {
      setDragOffset({ x: gestureState.dx, y: gestureState.dy });
    }
  };

  const handlePhotoRelease = (photoId: string, gestureState: any, index: number) => {
    if (draggedPhoto === photoId) {
      // Calculate target position
      const photoWidth = 80 + 12; // photo width + gap
      const targetIndex = Math.round(gestureState.dx / photoWidth) + index;
      
      if (targetIndex >= 0 && targetIndex < photos.length && targetIndex !== index) {
        movePhoto(index, targetIndex);
      }
      
      setDraggedPhoto(null);
      setDragOffset({ x: 0, y: 0 });
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
              Photos
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Add and arrange your photos. The first photo will be your main profile picture. {draggedPhoto ? 'Drag to reorder photos' : 'Press and drag photos to reorder'}.
            </Text>
            
            <View style={styles.photosContainer}>
              {photos.map((photo, index) => {
                const isDragging = draggedPhoto === photo.id;
                const panResponder = PanResponder.create({
                  onStartShouldSetPanResponder: () => true,
                  onMoveShouldSetPanResponder: (evt, gestureState) => {
                    return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
                  },
                  onPanResponderGrant: () => {
                    setDraggedPhoto(photo.id);
                    setDragOffset({ x: 0, y: 0 });
                  },
                  onPanResponderMove: (evt, gestureState) => {
                    handlePhotoDrag(photo.id, gestureState);
                  },
                  onPanResponderRelease: (evt, gestureState) => {
                    handlePhotoRelease(photo.id, gestureState, index);
                  },
                });
                
                return (
                  <Animated.View
                    key={photo.id}
                    style={[
                      styles.photoItem,
                      isDragging && styles.draggingPhoto,
                      {
                        transform: [
                          { translateX: isDragging ? dragOffset.x : 0 },
                          { translateY: isDragging ? dragOffset.y : 0 },
                          { scale: isDragging ? 1.1 : 1 },
                        ],
                        zIndex: isDragging ? 1000 : 1,
                      }
                    ]}
                    {...panResponder.panHandlers}
                  >
                    <Image source={{ uri: photo.photoUrl }} style={styles.photoPreview} />
                    {index === 0 && (
                      <View style={styles.mainPhotoBadge}>
                        <Text style={styles.mainPhotoBadgeText}>Main</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => deletePhoto(photo.id)}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                    {photos.length > 1 && (
                      <View style={styles.dragHandle}>
                        <Text style={styles.dragHandleText}>⋮⋮</Text>
                      </View>
                    )}
                    {isDragging && (
                      <View style={styles.dragIndicator}>
                        <Text style={styles.dragIndicatorText}>Drag to reorder</Text>
                        <TouchableOpacity
                          style={styles.cancelDragButton}
                          onPress={() => {
                            setDraggedPhoto(null);
                            setDragOffset({ x: 0, y: 0 });
                          }}
                        >
                          <Text style={styles.cancelDragText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
              
              {photos.length < 5 && (
                <TouchableOpacity 
                  style={styles.addPhotoButton} 
                  onPress={pickPhoto}
                  disabled={uploadingPhotos}
                >
                  <Text style={styles.addPhotoText}>
                    {uploadingPhotos ? 'Uploading...' : '+ Add Photo'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card.Content>
        </Card>

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
              {/* Show selected hobbies */}
              {selectedHobbies.map((hobbyName) => {
                const hobby = hobbiesData?.data?.find(h => h.name === hobbyName);
                return (
                  <Chip
                    key={hobbyName}
                    selected={true}
                    onPress={() => toggleHobby(hobbyName)}
                    style={styles.selectedHobbyChip}
                    icon="check"
                  >
                    {hobbyName}
                  </Chip>
                );
              })}
              
              {/* Add Hobbies Button */}
              <TouchableOpacity
                style={styles.addHobbyButton}
                onPress={() => setShowHobbyModal(true)}
              >
                <Text style={styles.addHobbyButtonText}>+ Add Hobbies</Text>
              </TouchableOpacity>
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
              Additional Information (Optional)
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Share more about yourself to help others find you and create better matches.
            </Text>
            
            {/* Age */}
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Age"
                  value={value ? value.toString() : ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="Enter your age"
                />
              )}
            />
            {errors.age && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.age.message}
              </Text>
            )}

            {/* Job */}
            <Controller
              control={control}
              name="job"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Job/Profession"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., Software Engineer, Teacher, Doctor"
                />
              )}
            />

            {/* Company */}
            <Controller
              control={control}
              name="company"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Company"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., Google, Microsoft, Self-employed"
                />
              )}
            />

            {/* Education */}
            <Controller
              control={control}
              name="education"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Education Level"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., Bachelor's, Master's, PhD"
                />
              )}
            />

            {/* University */}
            <Controller
              control={control}
              name="university"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="University/School"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., Harvard, MIT, Local University"
                />
              )}
            />

            {/* Relationship Status */}
            <Controller
              control={control}
              name="relationshipStatus"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Relationship Status"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., Single, In a relationship, Married"
                />
              )}
            />

            {/* Looking For */}
            <Controller
              control={control}
              name="lookingFor"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Looking For"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., Friendship, Dating, Networking"
                  multiline
                  numberOfLines={2}
                />
              )}
            />

            {/* Languages */}
            <Controller
              control={control}
              name="languages"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Languages"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., English, Spanish, French"
                />
              )}
            />

            {/* Height */}
            <Controller
              control={control}
              name="height"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Height (cm)"
                  value={value ? value.toString() : ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="e.g., 175"
                />
              )}
            />
            {errors.height && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.height.message}
              </Text>
            )}

            {/* Lifestyle */}
            <Controller
              control={control}
              name="lifestyle"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Lifestyle"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="e.g., Active, Relaxed, Adventurous"
                />
              )}
            />

            {/* Additional Interests */}
            <Controller
              control={control}
              name="interests"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Additional Interests"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="Tell us more about your interests beyond hobbies"
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location Settings
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location Method</Text>
              <View style={styles.locationMethodContainer}>
                <Text style={styles.locationMethodText}>
                  {useLocation ? '📍 GPS Location Enabled' : '🌍 Manual Location'}
                </Text>
                <Switch
                  value={useLocation}
                  onValueChange={async (value) => {
                    console.log('Location switch changed to:', value);
                    setValue('useLocation', value);
                    
                    if (value) {
                      // When enabling GPS, get current location
                      try {
                        const locationData = await locationService.getCurrentLocationWithCity();
                        if (locationData) {
                          console.log('GPS location detected:', {
                            latitude: locationData.location.latitude,
                            longitude: locationData.location.longitude,
                            city: locationData.city,
                            country: locationData.country
                          });
                          setValue('latitude', locationData.location.latitude);
                          setValue('longitude', locationData.location.longitude);
                          setValue('country', locationData.country);
                          setValue('city', locationData.city);
                          Alert.alert(
                            'Location Detected',
                            `We detected you're in ${locationData.city}, ${locationData.country}.`,
                            [{ text: 'OK' }]
                          );
                        } else {
                          Alert.alert(
                            'Location Detection Failed',
                            'Could not detect your location. Please try again or select manually.',
                            [{ text: 'OK' }]
                          );
                          setValue('useLocation', false);
                        }
                      } catch (error) {
                        console.error('Error detecting location:', error);
                        Alert.alert(
                          'Location Error',
                          'Failed to detect your location. Please try again or select manually.',
                          [{ text: 'OK' }]
                        );
                        setValue('useLocation', false);
                      }
                    } else {
                      // When disabling GPS, clear coordinates
                      setValue('latitude', undefined);
                      setValue('longitude', undefined);
                    }
                  }}
                />
              </View>
            </View>

            {!useLocation && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Country</Text>
                  <SearchablePicker
                    placeholder="Select your country"
                    data={countries}
                    selectedValue={selectedCountryCode}
                    onSelect={(value, label) => {
                      setSelectedCountryCode(value);
                      setValue('country', label);
                      setValue('city', ''); // Reset city when country changes
                    }}
                    searchPlaceholder="Search countries..."
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>City</Text>
                  <SearchablePicker
                    placeholder="Select your city"
                    data={selectedCountryCode ? citiesByCountry[selectedCountryCode] || [] : []}
                    selectedValue={city || ''}
                    onSelect={(value, label) => {
                      setValue('city', value);
                    }}
                    searchPlaceholder="Search cities..."
                  />
                </View>

              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Match Radius</Text>
              <TouchableOpacity 
                style={styles.radiusButton}
                onPress={() => {
                  setSelectedRadius(matchRadius);
                  setShowRadiusPicker(true);
                }}
              >
                <Text style={styles.radiusButtonText}>{matchRadius} km</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
            loading={saveProfileMutation.isPending}
            disabled={saveProfileMutation.isPending}
            style={styles.saveButton}
          >
            Save Profile
          </Button>
        </View>
      </ScrollView>

      {/* Radius Picker Modal */}
      <Modal
        visible={showRadiusPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRadiusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.radiusPickerModal}>
            <View style={styles.radiusPickerHeader}>
              <TouchableOpacity 
                onPress={() => setShowRadiusPicker(false)}
                style={styles.radiusPickerCancel}
              >
                <Text style={styles.radiusPickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.radiusPickerTitle}>Match Radius</Text>
              <TouchableOpacity 
                onPress={() => {
                  setValue('matchRadius', selectedRadius);
                  setShowRadiusPicker(false);
                }}
                style={styles.radiusPickerDone}
              >
                <Text style={styles.radiusPickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.radiusPickerWheel}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.radiusPickerScroll}
              >
                {Array.from({ length: 40 }, (_, i) => {
                  const radius = (i + 1) * 5;
                  return (
                    <TouchableOpacity 
                      key={radius} 
                      style={styles.radiusPickerItem}
                      onPress={() => setSelectedRadius(radius)}
                    >
                      <Text style={[
                        styles.radiusPickerItemText,
                        selectedRadius === radius && styles.radiusPickerItemTextSelected
                      ]}>
                        {radius} km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hobby Selection Modal */}
      <Modal
        visible={showHobbyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHobbyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Select Hobbies
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHobbyModal(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text variant="bodyMedium" style={styles.modalDescription}>
              Choose hobbies that interest you. You can select multiple hobbies.
            </Text>
            
            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search hobbies..."
              value={hobbySearchQuery}
              onChangeText={setHobbySearchQuery}
              left={<TextInput.Icon icon="magnify" />}
              mode="outlined"
            />
            
            {/* Filtered Hobbies */}
            <View style={styles.modalHobbiesContainer}>
              {hobbiesData?.data
                ?.filter(hobby => 
                  hobby.name.toLowerCase().includes(hobbySearchQuery.toLowerCase()) ||
                  hobby.category.toLowerCase().includes(hobbySearchQuery.toLowerCase())
                )
                .map((hobby) => {
                  const isSelected = selectedHobbies.includes(hobby.name);
                  return (
                    <Chip
                      key={hobby.id}
                      selected={isSelected}
                      onPress={() => toggleHobby(hobby.name)}
                      style={[
                        styles.modalHobbyChip,
                        isSelected && styles.selectedModalHobbyChip
                      ]}
                      icon={isSelected ? "check" : undefined}
                    >
                      {hobby.name}
                    </Chip>
                  );
                })}
            </View>
            
            {hobbiesData?.data?.filter(hobby => 
              hobby.name.toLowerCase().includes(hobbySearchQuery.toLowerCase()) ||
              hobby.category.toLowerCase().includes(hobbySearchQuery.toLowerCase())
            ).length === 0 && (
              <Text variant="bodyMedium" style={styles.noResultsText}>
                No hobbies found matching "{hobbySearchQuery}"
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  // Avatar styles
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6200ea',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ea',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarOverlayText: {
    fontSize: 20,
  },
  uploadButton: {
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  radiusButtons: {
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  locationMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  locationMethodText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  radiusButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  radiusPickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iPhone
  },
  radiusPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  radiusPickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  radiusPickerCancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  radiusPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  radiusPickerDone: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  radiusPickerDoneText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  radiusPickerWheel: {
    height: 200,
    backgroundColor: '#f8f9fa',
  },
  radiusPickerScroll: {
    flex: 1,
  },
  radiusPickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusPickerItemText: {
    fontSize: 20,
    color: '#666',
  },
  radiusPickerItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 22,
  },
  // Photo styles
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  draggingPhoto: {
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dragHandleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dragIndicator: {
    position: 'absolute',
    top: -25,
    left: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  dragIndicatorText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cancelDragButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelDragText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#6200ea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainPhotoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reorderButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#6200ea',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Hobby selection styles
  selectedHobbyChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#9c27b0',
  },
  addHobbyButton: {
    borderWidth: 2,
    borderColor: '#9c27b0',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHobbyButtonText: {
    color: '#9c27b0',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#9c27b0',
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  modalHobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  modalHobbyChip: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedModalHobbyChip: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
