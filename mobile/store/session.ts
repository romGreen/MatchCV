import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, VisibilityLevel, GeoPoint } from '@matchcv/shared';
import { locationService } from '@/lib/location';

interface SessionState {
  // User profile
  currentUser: UserProfile | null;
  
  // Location state
  currentLocation: GeoPoint | null;
  approximateLocation: GeoPoint | null;
  isLocationEnabled: boolean;
  locationPermission: 'granted' | 'denied' | 'not-requested';
  
  // Actions
  setCurrentUser: (user: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  setLocationPermission: (permission: 'granted' | 'denied' | 'not-requested') => void;
  setLocationEnabled: (enabled: boolean) => void;
  updateLocation: () => Promise<void>;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      currentLocation: null,
      approximateLocation: null,
      isLocationEnabled: false,
      locationPermission: 'not-requested',

      // Actions
      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      updateUserProfile: (updates) => {
        const currentUser = get().currentUser;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...updates,
            updatedAt: new Date(),
          };
          set({ currentUser: updatedUser });
        }
      },

      setLocationPermission: (permission) => {
        set({ locationPermission: permission });
      },

      setLocationEnabled: (enabled) => {
        set({ isLocationEnabled: enabled });
        if (enabled) {
          get().updateLocation();
        }
      },

      updateLocation: async () => {
        const { currentUser, isLocationEnabled } = get();
        
        if (!isLocationEnabled || !currentUser) {
          return;
        }

        try {
          const location = await locationService.getCurrentLocation();
          if (location) {
            const approximateLocation = locationService.roundToApproximateGrid(location);
            
            set({
              currentLocation: location,
              approximateLocation,
            });

            // Update user's location based on visibility setting
            const locationForVisibility = await locationService.getLocationForVisibility(
              currentUser.visibility
            );
            
            if (locationForVisibility) {
              get().updateUserProfile({ location: locationForVisibility });
            }
          }
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },

      clearSession: () => {
        set({
          currentUser: null,
          currentLocation: null,
          approximateLocation: null,
          isLocationEnabled: false,
          locationPermission: 'not-requested',
        });
      },
    }),
    {
      name: 'matchcv-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isLocationEnabled: state.isLocationEnabled,
        locationPermission: state.locationPermission,
      }),
    }
  )
);
