import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { GeoPoint } from '@matchcv/shared';

export class LocationService {
  private static instance: LocationService;
  private lastKnownLocation: GeoPoint | null = null;
  private locationWatchSubscription: Location.LocationSubscription | null = null;
  
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permission with better error handling
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      // Check if permission is already granted
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      if (currentStatus === 'granted') {
        return true;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      } else if (status === 'denied') {
        Alert.alert(
          'Location Permission Denied',
          'Location access is required to find nearby matches. You can enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please grant location permission to use this feature.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
      return false;
    }
  }

  /**
   * Get current location with improved accuracy and caching
   */
  async getCurrentLocation(): Promise<GeoPoint | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      
      if (!hasPermission) {
        return null;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to find nearby matches.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Cache the location
      this.lastKnownLocation = coords;
      return coords;
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // Return cached location if available
      if (this.lastKnownLocation) {
        return this.lastKnownLocation;
      }

      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location settings and try again.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  /**
   * Round location to approximate grid for privacy
   * This rounds to approximately 100m precision
   */
  roundToApproximateGrid(location: GeoPoint): GeoPoint {
    // Round to approximately 100m precision
    // 1 degree ≈ 111km, so 0.001 degree ≈ 111m
    const gridSize = 0.001;
    
    return {
      latitude: Math.round(location.latitude / gridSize) * gridSize,
      longitude: Math.round(location.longitude / gridSize) * gridSize,
    };
  }

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }

  /**
   * Start watching location changes
   */
  async startLocationWatch(
    callback: (location: GeoPoint) => void
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return false;
      }

      // Stop any existing watch
      if (this.locationWatchSubscription) {
        this.locationWatchSubscription.remove();
      }

      this.locationWatchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Update every 100 meters
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          this.lastKnownLocation = coords;
          callback(coords);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location watch:', error);
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  stopLocationWatch(): void {
    if (this.locationWatchSubscription) {
      this.locationWatchSubscription.remove();
      this.locationWatchSubscription = null;
    }
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): GeoPoint | null {
    return this.lastKnownLocation;
  }

  /**
   * Get city and country from coordinates using reverse geocoding
   */
  async getCityAndCountryFromLocation(location: GeoPoint): Promise<{ city: string; country: string } | null> {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const city = address.city || address.subregion || address.region || 'Unknown City';
        const country = address.country || 'Unknown Country';
        
        return { city, country };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting city/country from location:', error);
      return null;
    }
  }

  /**
   * Get current location and automatically detect city/country
   */
  async getCurrentLocationWithCity(): Promise<{ location: GeoPoint; city: string; country: string } | null> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        return null;
      }

      const cityCountry = await this.getCityAndCountryFromLocation(location);
      
      if (!cityCountry) {
        return null;
      }

      const result = {
        location,
        city: cityCountry.city,
        country: cityCountry.country,
      };
      return result;
    } catch (error) {
      console.error('Error getting location with city:', error);
      return null;
    }
  }

  /**
   * Get location with appropriate privacy level
   */
  async getLocationForUseLocation(useLocation: boolean): Promise<GeoPoint | null> {
    if (!useLocation) {
      return null;
    }

    const location = await this.getCurrentLocation();
    if (!location) {
      return null;
    }

    // Always return precise location for GPS users
    return location;
  }
}

export const locationService = LocationService.getInstance();
