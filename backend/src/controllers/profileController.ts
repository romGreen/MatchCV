import { Request, Response } from 'express';
import { ProfileService } from '../services/profileService';
import { ProfileFormData } from '../types/profile';

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  async createOrUpdateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { 
        displayName, bio, hobbies, useLocation, country, city, matchRadius, latitude, longitude,
        // Optional profile information
        age, job, company, education, university, relationshipStatus, lookingFor, interests, languages, height, lifestyle
      } = req.body;
      const userId = req.user!.id;
      
      // Ensure matchRadius is a number
      const numericMatchRadius = Number(matchRadius) || 10;
      
      
      const profileData: ProfileFormData = {
        displayName,
        bio,
        hobbies,
        useLocation,
        country,
        city,
        matchRadius: numericMatchRadius,
        latitude,
        longitude,
        // Optional profile information
        age,
        job,
        company,
        education,
        university,
        relationshipStatus,
        lookingFor,
        interests,
        languages,
        height,
        lifestyle,
      };

      const result = await this.profileService.createOrUpdateProfile(userId, profileData);

      if (result.success) {
        console.log('Returning formatted profile:', result.data);
        console.log('matchRadius in response:', result.data?.matchRadius);
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }

  async getProfileById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.profileService.getProfileById(id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
  }

  async getMatchScore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user!.id;
      const result = await this.profileService.getMatchScore(currentUserId, id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error calculating match score:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate match score' });
    }
  }


  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude } = req.body;
      const userId = req.user!.id;
      
      if (!latitude || !longitude) {
        res.status(400).json({ 
          success: false, 
          error: 'Latitude and longitude are required' 
        });
        return;
      }
      
      const result = await this.profileService.updateLocation(userId, latitude, longitude);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ success: false, error: 'Failed to update location' });
    }
  }

  async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      if (!(req as any).file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const userId = req.user!.id;
      const result = await this.profileService.uploadPhoto(userId, (req as any).file);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ success: false, error: 'Failed to upload photo' });
    }
  }

  async deletePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { photoId } = req.params;
      const userId = req.user!.id;
      
      const result = await this.profileService.deletePhoto(userId, photoId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ success: false, error: 'Failed to delete photo' });
    }
  }

  async updatePhotoOrder(req: Request, res: Response): Promise<void> {
    try {
      const { photoOrders } = req.body;
      const userId = req.user!.id;
      
      if (!photoOrders || !Array.isArray(photoOrders)) {
        res.status(400).json({ success: false, error: 'Photo orders array is required' });
        return;
      }
      
      const result = await this.profileService.updatePhotoOrder(userId, photoOrders);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error updating photo order:', error);
      res.status(500).json({ success: false, error: 'Failed to update photo order' });
    }
  }
}
