import { prisma } from '../lib/prisma';
import { ProfileFormData, UserProfile } from '../types/profile';
import { ApiResponse } from '../types/common';
import { GeocodingService } from './geocodingService';

export class ProfileService {
  async createOrUpdateProfile(userId: string, profileData: ProfileFormData): Promise<ApiResponse<UserProfile>> {
    try {
      
      // Use the useLocation from the request (true/false)
      const useLocation = profileData.useLocation ?? true;
      
      // Validate that all hobby IDs exist
      const existingHobbies = await prisma.hobby.findMany({
        where: { id: { in: profileData.hobbies } }
      });
      
      if (existingHobbies.length !== profileData.hobbies.length) {
        return { 
          success: false, 
          error: 'Some hobby IDs are invalid'
        };
      }
      
      // Handle location coordinates
      let latitude = profileData.latitude;
      let longitude = profileData.longitude;
      
      // Only geocode when useLocation is false (manual location) and no GPS coordinates provided
      if (!useLocation && profileData.city && profileData.country && (!latitude || !longitude)) {
        console.log('Geocoding city/country to coordinates (manual location):', profileData.city, profileData.country);
        const geocodingService = GeocodingService.getInstance();
        const geocodingResult = await geocodingService.getCoordinatesFromCityCountry(profileData.city, profileData.country);
        
        if (geocodingResult) {
          latitude = geocodingResult.latitude;
          longitude = geocodingResult.longitude;
          console.log('Geocoded coordinates:', latitude, longitude);
        } else {
          console.log('Geocoding failed, keeping existing coordinates');
        }
      } else if (useLocation && latitude && longitude) {
        console.log('Using GPS coordinates:', latitude, longitude);
      } else {
        console.log('No location coordinates provided, keeping existing coordinates');
      }

      // Build update data conditionally
      const updateData: any = {
        displayName: profileData.displayName,
        bio: profileData.bio,
        useLocation: useLocation,
        matchRadius: profileData.matchRadius || 10,
        country: profileData.country || null,
        city: profileData.city || null,
        // Update coordinates (either provided or geocoded)
        ...(latitude !== undefined && latitude !== null && { latitude }),
        ...(longitude !== undefined && longitude !== null && { longitude }),
        // Optional profile information
        age: profileData.age ?? null,
        job: profileData.job || null,
        company: profileData.company || null,
        education: profileData.education || null,
        university: profileData.university || null,
        relationshipStatus: profileData.relationshipStatus || null,
        lookingFor: profileData.lookingFor || null,
        interests: profileData.interests || null,
        languages: profileData.languages || null,
        height: profileData.height ?? null,
        lifestyle: profileData.lifestyle || null,
        hobbies: {
          deleteMany: {}, // Remove all existing hobbies
          create: profileData.hobbies.map((hobbyId: string) => ({
            hobby: {
              connect: { id: hobbyId }
            }
          }))
        },
        // Don't delete photos when updating profile - photos are managed separately
      };

      // Update existing profile or create new one
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            upsert: {
              create: {
                displayName: profileData.displayName,
                bio: profileData.bio,
                useLocation: useLocation,
                matchRadius: profileData.matchRadius || 10,
                country: profileData.country || null,
                city: profileData.city || null,
                latitude: latitude ?? undefined,
                longitude: longitude ?? undefined,
                // Optional profile information
                age: profileData.age ?? null,
                job: profileData.job || null,
                company: profileData.company || null,
                education: profileData.education || null,
                university: profileData.university || null,
                relationshipStatus: profileData.relationshipStatus || null,
                lookingFor: profileData.lookingFor || null,
                interests: profileData.interests || null,
                languages: profileData.languages || null,
                height: profileData.height ?? null,
                lifestyle: profileData.lifestyle || null,
                hobbies: {
                  create: profileData.hobbies.map((hobbyId: string) => ({
                    hobby: {
                      connect: { id: hobbyId }
                    }
                  }))
                },
                // Photos are managed separately via upload/delete endpoints
              } as any,
              update: updateData
            }
          }
        },
        include: {
          profile: {
            include: {
              hobbies: {
                include: {
                  hobby: true
                }
              },
              photos: {
                orderBy: {
                  order: 'asc'
                }
              }
            }
          }
        }
      });
      
      
      // Convert the database profile to the expected format
      const formattedProfile: UserProfile = {
        id: (user as any).profile.id,
        displayName: (user as any).profile.displayName,
        bio: (user as any).profile.bio,
        photos: (user as any).profile.photos?.map((photo: any) => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
          order: photo.order,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt
        })) || [],
        hobbies: (user as any).profile.hobbies.map((uh: any) => ({
          id: uh.hobby.id,
          name: uh.hobby.name,
          category: uh.hobby.category
        })),
        location: {
          latitude: (user as any).profile.latitude || 0,
          longitude: (user as any).profile.longitude || 0
        },
        useLocation: (user as any).profile.useLocation ?? true,
        matchRadius: (user as any).profile.matchRadius,
        country: (user as any).profile.country,
        city: (user as any).profile.city,
        // Optional profile information
        age: (user as any).profile.age,
        job: (user as any).profile.job,
        company: (user as any).profile.company,
        education: (user as any).profile.education,
        university: (user as any).profile.university,
        relationshipStatus: (user as any).profile.relationshipStatus,
        lookingFor: (user as any).profile.lookingFor,
        interests: (user as any).profile.interests,
        languages: (user as any).profile.languages,
        height: (user as any).profile.height,
        lifestyle: (user as any).profile.lifestyle,
        createdAt: (user as any).profile.createdAt,
        updatedAt: (user as any).profile.updatedAt
      };
      
      
      return { success: true, data: formattedProfile };
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  async getProfileById(profileId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
          hobbies: {
            include: {
              hobby: true
            }
          },
          photos: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      // Convert the database profile to the expected format
      const formattedProfile: UserProfile = {
        id: profile.id,
        displayName: profile.displayName,
        bio: profile.bio,
        photos: (profile as any).photos?.map((photo: any) => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
          order: photo.order,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt
        })) || [],
        hobbies: profile.hobbies.map((uh: any) => ({
          id: uh.hobby.id,
          name: uh.hobby.name,
          category: uh.hobby.category
        })),
        location: {
          latitude: profile.latitude || 0,
          longitude: profile.longitude || 0
        },
        useLocation: (profile as any).useLocation ?? true,
        matchRadius: profile.matchRadius || 10,
        country: profile.country || undefined,
        city: profile.city || undefined,
        // Optional profile information
        age: profile.age || undefined,
        job: profile.job || undefined,
        company: profile.company || undefined,
        education: profile.education || undefined,
        university: profile.university || undefined,
        relationshipStatus: profile.relationshipStatus || undefined,
        lookingFor: profile.lookingFor || undefined,
        interests: profile.interests || undefined,
        languages: profile.languages || undefined,
        height: profile.height || undefined,
        lifestyle: profile.lifestyle || undefined,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      };

      return { success: true, data: formattedProfile };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { success: false, error: 'Failed to fetch profile' };
    }
  }

  async getMatchScore(currentUserId: string, targetProfileId: string): Promise<ApiResponse<{ score: number; sharedHobbies: any[]; distance: number }>> {
    try {
      // Get current user's profile
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: {
          profile: {
            include: {
              hobbies: {
                include: {
                  hobby: true
                }
              }
            }
          }
        }
      });

      if (!currentUser?.profile) {
        return { success: false, error: 'Current user profile not found' };
      }

      // Get target user's profile
      const targetUser = await prisma.user.findFirst({
        where: {
          profile: {
            id: targetProfileId
          }
        },
        include: {
          profile: {
            include: {
              hobbies: {
                include: {
                  hobby: true
                }
              }
            }
          }
        }
      });

      if (!targetUser?.profile) {
        return { success: false, error: 'Target profile not found' };
      }

      // Calculate distance
      const distance = this.calculateDistance(
        currentUser.profile.latitude || 0,
        currentUser.profile.longitude || 0,
        targetUser.profile.latitude || 0,
        targetUser.profile.longitude || 0
      );

      // Calculate match score using the same algorithm as DiscoveryService
      const currentUserHobbies = currentUser.profile.hobbies.map((uh: any) => uh.hobby.id);
      const targetUserHobbies = targetUser.profile.hobbies.map((uh: any) => uh.hobby.id);
      const sharedHobbies = currentUserHobbies.filter(hobbyId => 
        targetUserHobbies.includes(hobbyId)
      );

      // Calculate enhanced match score considering multiple factors
      const totalHobbies = Math.max(currentUserHobbies.length, targetUserHobbies.length);
      const hobbyScore = totalHobbies > 0 ? (sharedHobbies.length / totalHobbies) * 100 : 0;
      
      // Calculate additional compatibility factors
      let compatibilityBonus = 0;
      const currentUserProfile = currentUser.profile as any;
      const targetUserProfile = targetUser.profile as any;
      
      // Age compatibility (within 5 years gets bonus)
      if (currentUserProfile?.age && targetUserProfile?.age) {
        const ageDiff = Math.abs(currentUserProfile.age - targetUserProfile.age);
        if (ageDiff <= 5) compatibilityBonus += 10;
        else if (ageDiff <= 10) compatibilityBonus += 5;
      }
      
      // Job/Company compatibility
      if (currentUserProfile?.job && targetUserProfile?.job) {
        if (currentUserProfile.job.toLowerCase() === targetUserProfile.job.toLowerCase()) {
          compatibilityBonus += 15;
        } else if (currentUserProfile?.company && targetUserProfile?.company && 
                  currentUserProfile.company.toLowerCase() === targetUserProfile.company.toLowerCase()) {
          compatibilityBonus += 10;
        }
      }
      
      // Education compatibility
      if (currentUserProfile?.education && targetUserProfile?.education) {
        if (currentUserProfile.education.toLowerCase() === targetUserProfile.education.toLowerCase()) {
          compatibilityBonus += 10;
        }
      }
      
      // University compatibility
      if (currentUserProfile?.university && targetUserProfile?.university) {
        if (currentUserProfile.university.toLowerCase() === targetUserProfile.university.toLowerCase()) {
          compatibilityBonus += 15;
        }
      }
      
      // Language compatibility
      if (currentUserProfile?.languages && targetUserProfile?.languages) {
        const currentLanguages = currentUserProfile.languages.toLowerCase().split(/[,\s]+/);
        const targetLanguages = targetUserProfile.languages.toLowerCase().split(/[,\s]+/);
        const commonLanguages = currentLanguages.filter((lang: string) => 
          targetLanguages.includes(lang) && lang.length > 2
        );
        if (commonLanguages.length > 0) {
          compatibilityBonus += Math.min(commonLanguages.length * 5, 15);
        }
      }
      
      // Lifestyle compatibility
      if (currentUserProfile?.lifestyle && targetUserProfile?.lifestyle) {
        if (currentUserProfile.lifestyle.toLowerCase() === targetUserProfile.lifestyle.toLowerCase()) {
          compatibilityBonus += 10;
        }
      }
      
      // Relationship status compatibility
      if (currentUserProfile?.relationshipStatus && targetUserProfile?.relationshipStatus) {
        if (currentUserProfile.relationshipStatus.toLowerCase() === targetUserProfile.relationshipStatus.toLowerCase()) {
          compatibilityBonus += 5;
        }
      }
      
      // Calculate final match percentage (hobbies + compatibility bonus, capped at 100%)
      const matchPercentage = Math.min(Math.round(hobbyScore + compatibilityBonus), 100);

      const sharedHobbiesData = targetUser.profile.hobbies
        .filter((uh: any) => sharedHobbies.includes(uh.hobby.id))
        .map((uh: any) => ({
          id: uh.hobby.id,
          name: uh.hobby.name,
          category: uh.hobby.category
        }));

      return {
        success: true,
        data: {
          score: matchPercentage,
          sharedHobbies: sharedHobbiesData,
          distance: Math.round(distance * 100) / 100
        }
      };
    } catch (error) {
      console.error('Error calculating match score:', error);
      return { success: false, error: 'Failed to calculate match score' };
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }


  async updateLocation(userId: string, latitude: number, longitude: number): Promise<ApiResponse<{ message: string }>> {
    try {
      await prisma.profile.update({
        where: { userId },
        data: {
          latitude,
          longitude,
        }
      });
      
      return { success: true, data: { message: 'Location updated successfully' } };
    } catch (error) {
      console.error('Error updating location:', error);
      return { success: false, error: 'Failed to update location' };
    }
  }

  async uploadPhoto(userId: string, file: any): Promise<ApiResponse<{ photoUrl: string; photoId: string }>> {
    try {
      const photoUrl = `http://192.168.7.20:3001/uploads/${file.filename}`;
      
      // Get the current user's profile
      const profile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      // Get the highest order number for this user's photos
      // Check if this is the first photo (no existing photos)
      const existingPhotos = await prisma.userPhoto.findMany({
        where: { userId: profile.id },
        orderBy: { order: 'asc' }
      });

      // If no photos exist, this becomes the main photo (order 0)
      // If photos exist, add to the end
      const nextOrder = existingPhotos.length === 0 ? 0 : existingPhotos.length;
      
      const photo = await prisma.userPhoto.create({
        data: {
          userId: profile.id,
          photoUrl,
          order: nextOrder
        }
      });

      return { success: true, data: { photoUrl, photoId: photo.id } };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: 'Failed to upload photo' };
    }
  }

  async deletePhoto(userId: string, photoId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // First verify the photo belongs to the user
      const profile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      // Check if the photo exists and belongs to this user
      const photo = await prisma.userPhoto.findFirst({
        where: { 
          id: photoId,
          userId: profile.id
        }
      });

      if (!photo) {
        return { success: false, error: 'Photo not found or not owned by user' };
      }

      await prisma.userPhoto.delete({
        where: { id: photoId }
      });
      
      return { success: true, data: { message: 'Photo deleted successfully' } };
    } catch (error) {
      console.error('Error deleting photo:', error);
      return { success: false, error: 'Failed to delete photo' };
    }
  }

  async updatePhotoOrder(userId: string, photoOrders: { photoId: string; order: number }[]): Promise<ApiResponse<{ message: string }>> {
    try {
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      // Update each photo's order
      for (const { photoId, order } of photoOrders) {
        await prisma.userPhoto.updateMany({
          where: {
            id: photoId,
            userId: profile.id
          },
          data: { order }
        });
      }

      return { success: true, data: { message: 'Photo order updated successfully' } };
    } catch (error) {
      console.error('Error updating photo order:', error);
      return { success: false, error: 'Failed to update photo order' };
    }
  }
}
