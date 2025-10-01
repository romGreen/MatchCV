import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export class GeocodingService {
  private static instance: GeocodingService;
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Convert city and country to coordinates using OpenStreetMap Nominatim API
   */
  async getCoordinatesFromCityCountry(city: string, country: string): Promise<GeocodingResult | null> {
    try {
      const query = `${city}, ${country}`;
      const response = await axios.get(`${this.NOMINATIM_BASE_URL}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'MatchCV/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city: result.address?.city || result.address?.town || city,
          country: result.address?.country || country
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get coordinates for a specific address
   */
  async getCoordinatesFromAddress(address: string): Promise<GeocodingResult | null> {
    try {
      const response = await axios.get(`${this.NOMINATIM_BASE_URL}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'MatchCV/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city: result.address?.city || result.address?.town || 'Unknown',
          country: result.address?.country || 'Unknown'
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}
