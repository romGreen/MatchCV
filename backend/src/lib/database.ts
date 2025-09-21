import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  visibilityLevel: 'precise' | 'neighborhood' | 'hidden';
  lastActive: string;
  latitude?: number;
  longitude?: number;
  hobbies: string[];
}

interface Hobby {
  id: string;
  name: string;
  category: string;
}

class Database {
  private dataDir = path.join(__dirname, '../../data');
  private usersFile = path.join(this.dataDir, 'users.json');
  private profilesFile = path.join(this.dataDir, 'profiles.json');
  private hobbiesFile = path.join(this.dataDir, 'hobbies.json');

  constructor() {
    this.ensureDataDir();
    this.initializeData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initializeData() {
    // Initialize hobbies if file doesn't exist
    if (!fs.existsSync(this.hobbiesFile)) {
      const defaultHobbies: Hobby[] = [
        { id: '1', name: 'Photography', category: 'Arts' },
        { id: '2', name: 'Cooking', category: 'Lifestyle' },
        { id: '3', name: 'Hiking', category: 'Sports' },
        { id: '4', name: 'Reading', category: 'Lifestyle' },
        { id: '5', name: 'Gaming', category: 'Entertainment' },
        { id: '6', name: 'Music', category: 'Arts' },
        { id: '7', name: 'Travel', category: 'Lifestyle' },
        { id: '8', name: 'Fitness', category: 'Sports' },
        { id: '9', name: 'Painting', category: 'Arts' },
        { id: '10', name: 'Dancing', category: 'Arts' },
      ];
      this.writeFile(this.hobbiesFile, defaultHobbies);
    }

    // Initialize empty arrays for users and profiles
    if (!fs.existsSync(this.usersFile)) {
      this.writeFile(this.usersFile, []);
    }
    if (!fs.existsSync(this.profilesFile)) {
      this.writeFile(this.profilesFile, []);
    }
  }

  private readFile<T>(filePath: string): T[] {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private writeFile<T>(filePath: string, data: T[]): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // Hobby methods
  getHobbies(): Hobby[] {
    return this.readFile<Hobby>(this.hobbiesFile);
  }

  getHobbyById(id: string): Hobby | undefined {
    const hobbies = this.getHobbies();
    return hobbies.find(hobby => hobby.id === id);
  }

  // User methods
  getUsers(): User[] {
    return this.readFile<User>(this.usersFile);
  }

  getUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.email === email);
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.writeFile(this.usersFile, users);
    return newUser;
  }

  // Profile methods
  getProfiles(): Profile[] {
    return this.readFile<Profile>(this.profilesFile);
  }

  getProfileById(id: string): Profile | undefined {
    const profiles = this.getProfiles();
    return profiles.find(profile => profile.id === id);
  }

  getProfileByUserId(userId: string): Profile | undefined {
    const profiles = this.getProfiles();
    return profiles.find(profile => profile.userId === userId);
  }

  createProfile(profile: Omit<Profile, 'id' | 'lastActive'>): Profile {
    const profiles = this.getProfiles();
    const newProfile: Profile = {
      ...profile,
      id: Date.now().toString(),
      lastActive: new Date().toISOString(),
    };
    profiles.push(newProfile);
    this.writeFile(this.profilesFile, profiles);
    return newProfile;
  }

  updateProfile(id: string, updates: Partial<Profile>): Profile | null {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(profile => profile.id === id);
    if (index === -1) return null;

    profiles[index] = { ...profiles[index], ...updates };
    this.writeFile(this.profilesFile, profiles);
    return profiles[index];
  }

  // Location-based search
  getNearbyProfiles(latitude: number, longitude: number, radiusKm: number = 5): Profile[] {
    const profiles = this.getProfiles();
    return profiles.filter(profile => {
      if (!profile.latitude || !profile.longitude) return false;
      
      const distance = this.calculateDistance(
        latitude, longitude,
        profile.latitude, profile.longitude
      );
      
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const db = new Database();
