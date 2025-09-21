import * as Location from 'expo-location';
import { GeoPoint } from '@matchcv/shared';

export class LocationService {
  private static instance: LocationService;
  
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permission and get current location
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current location with error handling
   */
  async getCurrentLocation(): Promise<GeoPoint | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
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
   * Get location with appropriate privacy level
   */
  async getLocationForVisibility(visibility: 'precise' | 'neighborhood' | 'hidden'): Promise<GeoPoint | null> {
    if (visibility === 'hidden') {
      return null;
    }

    const location = await this.getCurrentLocation();
    if (!location) {
      return null;
    }

    if (visibility === 'neighborhood') {
      return this.roundToApproximateGrid(location);
    }

    return location; // precise
  }
}

export const locationService = LocationService.getInstance();
