import { prisma } from '../lib/prisma';
import { ApiResponse } from '../types/common';

interface NearbyUser {
  profile: any;
  matchScore: {
    userId: string;
    score: number;
    sharedHobbies: any[];
    distance: number;
  };
}

export class DiscoveryService {
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

  async getNearbyUsersByUserId(userId: string, radius?: number): Promise<ApiResponse<{ users: NearbyUser[]; total: number }>> {
    try {
      // Get current user's profile with location
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
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
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      // Check if user has location data
      if (!currentUser.profile.latitude || !currentUser.profile.longitude) {
        return {
          success: false,
          error: 'User location not available. Please update your location in profile settings.'
        };
      }

      return await this.getNearbyUsers(
        userId,
        currentUser.profile.latitude,
        currentUser.profile.longitude,
        radius
      );
    } catch (error) {
      console.error('Error fetching nearby users by user ID:', error);
      return {
        success: false,
        error: 'Failed to fetch nearby users'
      };
    }
  }

  async getNearbyUsers(userId: string, latitude: number, longitude: number, radius?: number): Promise<ApiResponse<{ users: NearbyUser[]; total: number }>> {
    try {
      // Get current user's profile to determine their match radius
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
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
        return { success: false, error: 'User profile not found' };
      }

      const searchRadius = radius || (currentUser.profile as any).matchRadius || 10;

      // Get all users with profiles and their hobbies
      const users = await prisma.user.findMany({
        where: {
          id: { not: userId }, // Exclude current user
          profile: {
            isNot: null
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

      // Filter users by distance and calculate match scores
      const nearbyUsers: NearbyUser[] = [];
      const currentUserHobbies = currentUser.profile.hobbies.map((uh: any) => uh.hobby.id);

      for (const user of users) {
        const profile = (user as any).profile;
        if (!profile || !profile.latitude || !profile.longitude) continue;
        
        // Check if user has location enabled
        if (!profile.useLocation) continue;

        const distance = this.calculateDistance(
          latitude, longitude,
          profile.latitude, profile.longitude
        );

        if (distance <= searchRadius) {
          // Calculate match score based on shared hobbies
          const userHobbies = profile.hobbies.map((uh: any) => uh.hobby.id);
          const sharedHobbies = currentUserHobbies.filter(hobbyId => 
            userHobbies.includes(hobbyId)
          );

          // Calculate enhanced match score considering multiple factors
          const totalHobbies = Math.max(currentUserHobbies.length, userHobbies.length);
          const hobbyScore = totalHobbies > 0 ? (sharedHobbies.length / totalHobbies) * 100 : 0;
          
          // Calculate additional compatibility factors
          let compatibilityBonus = 0;
          const currentUserProfile = currentUser.profile as any; // Type assertion for new fields
          
          // Age compatibility (within 5 years gets bonus)
          if (currentUserProfile?.age && (profile as any).age) {
            const ageDiff = Math.abs(currentUserProfile.age - (profile as any).age);
            if (ageDiff <= 5) compatibilityBonus += 10;
            else if (ageDiff <= 10) compatibilityBonus += 5;
          }
          
          // Job/Company compatibility
          if (currentUserProfile?.job && (profile as any).job) {
            if (currentUserProfile.job.toLowerCase() === (profile as any).job.toLowerCase()) {
              compatibilityBonus += 15;
            } else if (currentUserProfile?.company && (profile as any).company && 
                      currentUserProfile.company.toLowerCase() === (profile as any).company.toLowerCase()) {
              compatibilityBonus += 10;
            }
          }
          
          // Education compatibility
          if (currentUserProfile?.education && (profile as any).education) {
            if (currentUserProfile.education.toLowerCase() === (profile as any).education.toLowerCase()) {
              compatibilityBonus += 10;
            }
          }
          
          // University compatibility
          if (currentUserProfile?.university && (profile as any).university) {
            if (currentUserProfile.university.toLowerCase() === (profile as any).university.toLowerCase()) {
              compatibilityBonus += 15;
            }
          }
          
          // Language compatibility
          if (currentUserProfile?.languages && (profile as any).languages) {
            const currentLanguages = currentUserProfile.languages.toLowerCase().split(/[,\s]+/);
            const userLanguages = (profile as any).languages.toLowerCase().split(/[,\s]+/);
            const commonLanguages = currentLanguages.filter((lang: string) => 
              userLanguages.includes(lang) && lang.length > 2
            );
            if (commonLanguages.length > 0) {
              compatibilityBonus += Math.min(commonLanguages.length * 5, 15);
            }
          }
          
          // Lifestyle compatibility
          if (currentUserProfile?.lifestyle && (profile as any).lifestyle) {
            if (currentUserProfile.lifestyle.toLowerCase() === (profile as any).lifestyle.toLowerCase()) {
              compatibilityBonus += 10;
            }
          }
          
          // Relationship status compatibility
          if (currentUserProfile?.relationshipStatus && (profile as any).relationshipStatus) {
            if (currentUserProfile.relationshipStatus.toLowerCase() === (profile as any).relationshipStatus.toLowerCase()) {
              compatibilityBonus += 5;
            }
          }
          
          // Calculate final match percentage (hobbies + compatibility bonus, capped at 100%)
          const matchPercentage = Math.min(Math.round(hobbyScore + compatibilityBonus), 100);

          const matchScore = {
            userId: user.id,
            score: matchPercentage,
            sharedHobbies: profile.hobbies
              .filter((uh: any) => sharedHobbies.includes(uh.hobby.id))
              .map((uh: any) => ({
                id: uh.hobby.id,
                name: uh.hobby.name,
                category: uh.hobby.category
              })),
            distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
          };

          nearbyUsers.push({
            profile: {
              id: profile.id,
              displayName: profile.displayName,
              bio: profile.bio,
              photos: profile.photos?.map((photo: any) => ({
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
                latitude: profile.latitude,
                longitude: profile.longitude
              },
              useLocation: (profile as any).useLocation ?? true,
              matchRadius: (profile as any).matchRadius || 10,
              country: (profile as any).country,
              city: (profile as any).city,
              // Optional profile information
              age: (profile as any).age,
              job: (profile as any).job,
              company: (profile as any).company,
              education: (profile as any).education,
              university: (profile as any).university,
              relationshipStatus: (profile as any).relationshipStatus,
              lookingFor: (profile as any).lookingFor,
              interests: (profile as any).interests,
              languages: (profile as any).languages,
              height: (profile as any).height,
              lifestyle: (profile as any).lifestyle,
              createdAt: profile.createdAt,
              updatedAt: profile.updatedAt
            },
            matchScore
          });
        }
      }

      // Sort by match score (descending) and then by distance (ascending)
      nearbyUsers.sort((a, b) => {
        if (b.matchScore.score !== a.matchScore.score) {
          return b.matchScore.score - a.matchScore.score;
        }
        return a.matchScore.distance - b.matchScore.distance;
      });

      return {
        success: true,
        data: {
          users: nearbyUsers,
          total: nearbyUsers.length
        }
      };
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      return { success: false, error: 'Failed to fetch nearby users' };
    }
  }
}
