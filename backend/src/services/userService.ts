import { prisma } from '../lib/prisma';

export class UserService {
  async getAllUsers() {
    try {
      const users = await prisma.user.findMany({
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
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return { 
        success: true, 
        data: users.map(user => ({
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          profile: user.profile
        }))
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async testDelete() {
    console.log('=== TEST DELETE ENDPOINT REACHED ===');
    return { success: true, message: 'Test endpoint works' };
  }

  async deleteUser(userId: string) {
    try {
      console.log('=== DELETE ACCOUNT ENDPOINT REACHED ===');
      console.log('Delete account request - User ID from token:', userId);
      
      // Get user info before deletion
      console.log('Searching for user with ID:', userId);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          profile: {
            include: {
              hobbies: true,
              matches: true,
              matches2: true,
              messages: true
            }
          }
        }
      });
      
      console.log('User found in database:', user ? 'Yes' : 'No');
      if (user) {
        console.log('User email:', user.email);
        console.log('User profile exists:', !!user.profile);
        if (user.profile) {
          console.log('Profile hobbies count:', user.profile.hobbies.length);
          console.log('Profile matches count:', user.profile.matches.length + user.profile.matches2.length);
          console.log('Profile messages count:', user.profile.messages.length);
        }
      } else {
        // Let's see what users actually exist
        const allUsers = await prisma.user.findMany();
        console.log('All users in database:', allUsers.map(u => ({ id: u.id, email: u.email })));
      }
      
      if (!user) {
        return { 
          success: false, 
          error: 'User not found' 
        };
      }
      
      // Delete user (this will cascade delete profile, user_hobbies, etc.)
      console.log('Attempting to delete user...');
      const deleteResult = await prisma.user.delete({
        where: { id: userId }
      });
      
      console.log('Delete result:', deleteResult);
      console.log(`User ${user.email} deleted their own account`);
      
      // Verify deletion
      const verifyUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      console.log('User still exists after deletion:', !!verifyUser);
      
      return { 
        success: true, 
        message: 'Account deleted successfully' 
      };
    } catch (error) {
      console.error('Error deleting user account:', error);
      console.error('Error details:', error);
      throw new Error('Failed to delete account');
    }
  }

  async deleteUserById(id: string, currentUserId: string) {
    try {
      // Prevent users from deleting themselves
      if (id === currentUserId) {
        return { 
          success: false, 
          error: 'You cannot delete your own account' 
        };
      }
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
        include: { profile: true }
      });
      
      if (!user) {
        return { 
          success: false, 
          error: 'User not found' 
        };
      }
      
      // Delete user (this will cascade delete profile, user_hobbies, etc. due to Prisma relations)
      await prisma.user.delete({
        where: { id }
      });
      
      console.log(`User ${user.email} deleted successfully`);
      
      return { 
        success: true, 
        message: `User ${user.email} deleted successfully` 
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}
