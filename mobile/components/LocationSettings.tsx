import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder, Alert } from 'react-native';
import { Text, Button, Card, Switch, ActivityIndicator } from 'react-native-paper';
import LocationPicker from './LocationPicker';
import { locationService } from '@/lib/location';

interface LocationSettingsProps {
  useLocation: boolean;
  onUseLocationChange: (useLocation: boolean) => void;
  country?: string;
  city?: string;
  onLocationChange: (country: string, city: string, coordinates?: { latitude: number; longitude: number }) => void;
  matchRadius: number;
  onRadiusChange: (radius: number) => void;
}

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

export default function LocationSettings({
  useLocation,
  onUseLocationChange,
  country,
  city,
  onLocationChange,
  matchRadius,
  onRadiusChange,
}: LocationSettingsProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const getLocationText = () => {
    if (useLocation) return 'Using GPS location';
    if (country && city) return `${city}, ${country}`;
    return 'Select location manually';
  };

  const getLocationDescription = () => {
    if (useLocation) {
      return 'Automatically detect your current location';
    }
    return 'Set your location manually';
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      // When enabling location, try to auto-detect city/country
      setIsDetectingLocation(true);
      try {
        const locationData = await locationService.getCurrentLocationWithCity();
        if (locationData) {
          // Auto-set the detected city/country AND coordinates
          onLocationChange(locationData.country, locationData.city, {
            latitude: locationData.location.latitude,
            longitude: locationData.location.longitude
          });
          onUseLocationChange(true);
          Alert.alert(
            'Location Detected',
            `We detected you're in ${locationData.city}, ${locationData.country}. You'll see people from the same area.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Location Detection Failed',
            'Could not detect your location. Please select your city manually.',
            [{ text: 'OK' }]
          );
          onUseLocationChange(false);
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        Alert.alert(
          'Location Error',
          'Failed to detect your location. Please try again or select manually.',
          [{ text: 'OK' }]
        );
        onUseLocationChange(false);
      } finally {
        setIsDetectingLocation(false);
      }
    } else {
      onUseLocationChange(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Location
      </Text>
      <Text variant="bodySmall" style={styles.sectionDescription}>
        Choose how to set your location for matching
      </Text>

      {/* Location Toggle */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text variant="titleSmall" style={styles.switchTitle}>
                GPS Location
              </Text>
              <Text variant="bodySmall" style={styles.switchDescription}>
                {getLocationDescription()}
              </Text>
            </View>
            {isDetectingLocation ? (
              <ActivityIndicator size="small" color="#6200ea" />
            ) : (
              <Switch
                value={useLocation}
                onValueChange={handleLocationToggle}
                color="#6200ea"
              />
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Manual Location Selection - Only shown when location is disabled */}
      {!useLocation && (
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.locationRow}>
              <View style={styles.locationContent}>
                <Text variant="titleSmall" style={styles.locationTitle}>
                  Select Your Location
                </Text>
                <Text variant="bodyMedium" style={styles.locationText}>
                  {getLocationText()}
                </Text>
              </View>
              <Button
                mode="outlined"
                onPress={() => setShowLocationPicker(true)}
                compact
              >
                {country && city ? 'Change' : 'Select'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Match Radius - Only shown when GPS location is enabled */}
      {useLocation && (
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.radiusContent}>
              <Text variant="titleSmall" style={styles.radiusTitle}>
                Match Radius
              </Text>
              <Text variant="bodySmall" style={styles.radiusDescription}>
                How far to search for matches from your location
              </Text>
              
              <CustomSlider
                value={matchRadius}
                onValueChange={onRadiusChange}
                minimumValue={1}
                maximumValue={100}
                step={1}
              />
              <View style={styles.radiusValueContainer}>
                <Text variant="bodySmall" style={styles.radiusValue}>
                  {Math.round(matchRadius)} km
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={onLocationChange}
        currentCountry={country}
        currentCity={city}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  sectionDescription: {
    color: '#666',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    paddingVertical: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    color: '#666',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContent: {
    flex: 1,
    marginRight: 16,
  },
  locationTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    color: '#333',
  },
  radiusContent: {
    paddingVertical: 8,
  },
  radiusTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  radiusDescription: {
    color: '#666',
    marginBottom: 16,
  },
  // Custom Slider styles
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
  radiusValueContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  radiusValue: {
    fontWeight: '600',
    color: '#6200ea',
    fontSize: 16,
  },
});
