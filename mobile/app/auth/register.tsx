import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '../../lib/auth';
import { apiService } from '../../lib/api';
import { RegisterRequest, HobbyTag } from '@matchcv/shared';
import SearchablePicker from '../../components/SearchablePicker';
import { countries, citiesByCountry } from '../../data/locations';
import { locationService } from '../../lib/location';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hobbies, setHobbies] = useState<HobbyTag[]>([]);
  
  // Location state
  const [useLocation, setUseLocation] = useState<boolean | null>(null);
  const [locationCoordinates, setLocationCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Optional profile fields
  const [age, setAge] = useState('');
  const [job, setJob] = useState('');
  const [company, setCompany] = useState('');
  const [education, setEducation] = useState('');
  const [university, setUniversity] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [interests, setInterests] = useState('');
  const [languages, setLanguages] = useState('');
  const [height, setHeight] = useState('');
  const [lifestyle, setLifestyle] = useState('');

  // Hobby modal state
  const [showHobbyModal, setShowHobbyModal] = useState(false);
  const [hobbySearchQuery, setHobbySearchQuery] = useState('');

  React.useEffect(() => {
    loadHobbies();
  }, []);

  const loadHobbies = async () => {
    try {
      const response = await apiService.getHobbies();
      if (response.success && response.data) {
        setHobbies(response.data);
      }
    } catch (error) {
      console.error('Failed to load hobbies:', error);
    }
  };

  const toggleHobby = (hobbyName: string) => {
    setSelectedHobbies(prev => 
      prev.includes(hobbyName) 
        ? prev.filter(h => h !== hobbyName)
        : [...prev, hobbyName]
    );
  };

  const handleLocationChoice = async (useGPS: boolean) => {
    setUseLocation(useGPS);
    
    if (useGPS) {
      setDetectingLocation(true);
      try {
        const locationData = await locationService.getCurrentLocationWithCity();
        if (locationData) {
          setLocationCoordinates({
            latitude: locationData.location.latitude,
            longitude: locationData.location.longitude
          });
          setCountry(locationData.country);
          setCity(locationData.city);
          Alert.alert(
            'Location Detected',
            `We detected you're in ${locationData.city}, ${locationData.country}.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Location Detection Failed',
            'Could not detect your location. Please select your city manually.',
            [{ text: 'OK' }]
          );
          setUseLocation(false);
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        Alert.alert(
          'Location Error',
          'Failed to detect your location. Please try again or select manually.',
          [{ text: 'OK' }]
        );
        setUseLocation(false);
      } finally {
        setDetectingLocation(false);
      }
    }
  };

  const pickImage = async () => {
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
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegister = async () => {
    if (!email || !password || !displayName || !country || !city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Error', 'Please upload at least one photo to complete registration');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Convert hobby names to IDs
      const hobbyIds = hobbies
        .filter(hobby => selectedHobbies.includes(hobby.name))
        .map(hobby => hobby.id);

      // Build optional fields object - only include fields that have values
      const optionalFields: any = {};
      if (age && age.trim()) optionalFields.age = parseInt(age);
      if (job && job.trim()) optionalFields.job = job;
      if (company && company.trim()) optionalFields.company = company;
      if (education && education.trim()) optionalFields.education = education;
      if (university && university.trim()) optionalFields.university = university;
      if (relationshipStatus && relationshipStatus.trim()) optionalFields.relationshipStatus = relationshipStatus;
      if (lookingFor && lookingFor.trim()) optionalFields.lookingFor = lookingFor;
      if (interests && interests.trim()) optionalFields.interests = interests;
      if (languages && languages.trim()) optionalFields.languages = languages;
      if (height && height.trim()) optionalFields.height = parseInt(height);
      if (lifestyle && lifestyle.trim()) optionalFields.lifestyle = lifestyle;


      const registerData: RegisterRequest = {
        email,
        password,
        displayName,
        bio,
        hobbies: hobbyIds,
        country,
        city,
        useLocation: useLocation || false,
        latitude: locationCoordinates?.latitude,
        longitude: locationCoordinates?.longitude,
        // Optional profile information - explicitly add each field
        age: optionalFields.age,
        job: optionalFields.job,
        company: optionalFields.company,
        education: optionalFields.education,
        university: optionalFields.university,
        relationshipStatus: optionalFields.relationshipStatus,
        lookingFor: optionalFields.lookingFor,
        interests: optionalFields.interests,
        languages: optionalFields.languages,
        height: optionalFields.height,
        lifestyle: optionalFields.lifestyle
      };

      
      const response = await authService.register(registerData);

      if (response.success) {
        // Upload photos after successful registration
        try {
          for (const photoUri of photos) {
            await apiService.uploadPhoto(photoUri);
          }
          Alert.alert('Success', 'Registration completed! Your photos have been uploaded.');
          router.replace('/(tabs)/discover');
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
          Alert.alert('Warning', 'Registration successful, but photo upload failed. You can add photos later in your profile.');
          router.replace('/profile/edit');
        }
      } else {
        Alert.alert('Error', response.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join MatchCV to find hobby buddies</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Display Name *</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your display name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Country *</Text>
                <SearchablePicker
                  placeholder="Select your country"
                  data={countries}
                  selectedValue={selectedCountryCode}
                  onSelect={(value, label) => {
                    setSelectedCountryCode(value);
                    setCountry(label);
                    setCity(''); // Reset city when country changes
                  }}
                  searchPlaceholder="Search countries..."
                />
              </View>

              {/* Location Choice */}
              {useLocation === null && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Location *</Text>
                  <Text style={styles.subLabel}>How would you like to set your location?</Text>
                  <View style={styles.locationChoiceContainer}>
                    <TouchableOpacity
                      style={styles.locationChoiceButton}
                      onPress={() => handleLocationChoice(true)}
                    >
                      <Text style={styles.locationChoiceText}>📍 Use GPS Location</Text>
                      <Text style={styles.locationChoiceSubtext}>Automatically detect your current location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.locationChoiceButton}
                      onPress={() => handleLocationChoice(false)}
                    >
                      <Text style={styles.locationChoiceText}>🌍 Select Manually</Text>
                      <Text style={styles.locationChoiceSubtext}>Choose your country and city</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Manual Location Selection */}
              {useLocation === false && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Country *</Text>
                    <SearchablePicker
                      placeholder="Select your country"
                      data={countries}
                      selectedValue={selectedCountryCode}
                      onSelect={(value, label) => {
                        setSelectedCountryCode(value);
                        setCountry(label);
                        setCity(''); // Reset city when country changes
                      }}
                      searchPlaceholder="Search countries..."
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>City *</Text>
                    <SearchablePicker
                      placeholder="Select your city"
                      data={selectedCountryCode ? citiesByCountry[selectedCountryCode] || [] : []}
                      selectedValue={city}
                      onSelect={(value, label) => {
                        setCity(value);
                      }}
                      searchPlaceholder="Search cities..."
                    />
                  </View>
                </>
              )}

              {/* GPS Location Display */}
              {useLocation === true && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Detected Location</Text>
                  <View style={styles.detectedLocationContainer}>
                    {detectingLocation ? (
                      <Text style={styles.detectedLocationText}>🔄 Detecting location...</Text>
                    ) : (
                      <Text style={styles.detectedLocationText}>📍 {city}, {country}</Text>
                    )}
                    <TouchableOpacity
                      style={styles.changeLocationButton}
                      onPress={() => setUseLocation(null)}
                    >
                      <Text style={styles.changeLocationText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Optional Profile Information */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Additional Information (Optional)</Text>
                <Text style={styles.subLabel}>Help others get to know you better</Text>
                
                <View style={styles.optionalFieldsContainer}>
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Age</Text>
                      <TextInput
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Height (cm)</Text>
                      <TextInput
                        style={styles.input}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Job</Text>
                      <TextInput
                        style={styles.input}
                        value={job}
                        onChangeText={setJob}
                      />  
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Company</Text>
                      <TextInput
                        style={styles.input}
                        value={company}
                        onChangeText={setCompany}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Education</Text>
                      <TextInput
                        style={styles.input}
                        value={education}
                        onChangeText={setEducation}
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>University</Text>
                      <TextInput
                        style={styles.input}
                        value={university}
                        onChangeText={setUniversity}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Relationship Status</Text>
                      <TextInput
                        style={styles.input}
                        value={relationshipStatus}
                        onChangeText={setRelationshipStatus}
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Looking For</Text>
                      <TextInput
                        style={styles.input}
                        value={lookingFor}
                        onChangeText={setLookingFor}
                      />
                    </View>
                  </View>

                  <View style={styles.fullInput}>
                    <Text style={styles.fieldLabel}>Languages</Text>
                    <TextInput
                      style={styles.input}
                      value={languages}
                      onChangeText={setLanguages}
                    />
                  </View>

                  <View style={styles.fullInput}>
                    <Text style={styles.fieldLabel}>Interests</Text>
                    <TextInput
                      style={styles.input}
                      value={interests}
                      onChangeText={setInterests}
                      placeholder="Travel, cooking, investing"
                    />
                  </View>

                  <View style={styles.fullInput}>
                    <Text style={styles.fieldLabel}>Lifestyle</Text>
                    <TextInput
                      style={styles.input}
                      value={lifestyle}
                      onChangeText={setLifestyle}
                      placeholder="Active, social, adventurous"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Photos (Required)</Text>
                <Text style={styles.subLabel}>Upload at least one photo to complete your registration</Text>
                
                <View style={styles.photosContainer}>
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri: photo }} style={styles.photoPreview} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Text style={styles.removePhotoText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {photos.length < 5 && (
                    <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                      <Text style={styles.addPhotoText}>
                        {photos.length === 0 ? '+ Add Photo (Required)' : '+ Add Photo'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hobbies</Text>
                <Text style={styles.subLabel}>Choose hobbies that interest you</Text>
                
                <View style={styles.hobbiesContainer}>
                  {/* Show selected hobbies */}
                  {selectedHobbies.map((hobbyName) => (
                    <TouchableOpacity
                      key={hobbyName}
                      style={styles.selectedHobbyChip}
                      onPress={() => toggleHobby(hobbyName)}
                    >
                      <Text style={styles.selectedHobbyText}>✓ {hobbyName}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Add Hobbies Button */}
                  <TouchableOpacity
                    style={styles.addHobbyButton}
                    onPress={() => setShowHobbyModal(true)}
                  >
                    <Text style={styles.addHobbyButtonText}>+ Add Hobbies</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Create Account '}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Hobby Selection Modal */}
      <Modal
        visible={showHobbyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHobbyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Hobbies</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHobbyModal(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Choose hobbies that interest you. You can select multiple hobbies.
            </Text>
            
            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search hobbies..."
              value={hobbySearchQuery}
              onChangeText={setHobbySearchQuery}
            />
            
            {/* Filtered Hobbies */}
            <View style={styles.modalHobbiesContainer}>
              {hobbies
                ?.filter(hobby => 
                  hobby.name.toLowerCase().includes(hobbySearchQuery.toLowerCase()) ||
                  hobby.category.toLowerCase().includes(hobbySearchQuery.toLowerCase())
                )
                .map((hobby) => {
                  const isSelected = selectedHobbies.includes(hobby.name);
                  return (
                    <TouchableOpacity
                      key={hobby.id}
                      style={[
                        styles.modalHobbyChip,
                        isSelected && styles.selectedModalHobbyChip
                      ]}
                      onPress={() => toggleHobby(hobby.name)}
                    >
                      <Text style={[
                        styles.modalHobbyText,
                        isSelected && styles.selectedModalHobbyText
                      ]}>
                        {isSelected ? '✓ ' : ''}{hobby.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
            
            {hobbies?.filter(hobby => 
              hobby.name.toLowerCase().includes(hobbySearchQuery.toLowerCase()) ||
              hobby.category.toLowerCase().includes(hobbySearchQuery.toLowerCase())
            ).length === 0 && (
              <Text style={styles.noResultsText}>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  form: {
    width: '100%',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  hobbyChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  hobbyText: {
    fontSize: 14,
    color: '#333',
  },
  hobbyTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  locationChoiceContainer: {
    gap: 12,
  },
  locationChoiceButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  locationChoiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationChoiceSubtext: {
    fontSize: 14,
    color: '#666',
  },
  detectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  detectedLocationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  changeLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  changeLocationText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
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
  // Optional fields styles
  optionalFieldsContainer: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  fullInput: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  // Hobby selection styles
  selectedHobbyChip: {
    backgroundColor: '#9c27b0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedHobbyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addHobbyButton: {
    borderWidth: 2,
    borderColor: '#9c27b0',
    borderStyle: 'dashed',
    borderRadius: 16,
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
    fontSize: 20,
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
    fontSize: 16,
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
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  selectedModalHobbyChip: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
  },
  modalHobbyText: {
    color: '#333',
    fontSize: 14,
  },
  selectedModalHobbyText: {
    color: '#fff',
    fontWeight: '600',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
    fontSize: 16,
  },
});
