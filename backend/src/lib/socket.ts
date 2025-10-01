import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { getUserById } from './auth';

export function setupSocketHandlers(io: Server) {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const user = await getUserById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.userId = user.id;
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`User ${socket.data.userId} connected`);
    
    // Join user to their personal room
    socket.join(`user:${socket.data.userId}`);

    // Handle joining chat rooms
    socket.on('join_chat', async (data) => {
      try {
        const { otherUserId } = data; // This is actually a profile ID
        const currentUserId = socket.data.userId;
        
        console.log('Join chat - Current user ID:', currentUserId);
        console.log('Join chat - Other profile ID:', otherUserId);
        
        // Get current user's profile
        const currentUserProfile = await prisma.profile.findUnique({
          where: { userId: currentUserId }
        });
        
        // The otherUserId is actually a profile ID, so we can use it directly
        const otherUserProfile = await prisma.profile.findUnique({
          where: { id: otherUserId }
        });
        
        console.log('Current user profile found:', currentUserProfile ? 'Yes' : 'No');
        console.log('Other user profile found:', otherUserProfile ? 'Yes' : 'No');
        
        if (!currentUserProfile || !otherUserProfile) {
          console.log('Missing profiles - Current:', currentUserProfile?.id, 'Other:', otherUserProfile?.id);
          throw new Error('User profiles not found');
        }
        
        // Find or create a chat room between these users
        let chat = await prisma.chat.findFirst({
          where: {
            match: {
              OR: [
                { profile1Id: currentUserProfile.id, profile2Id: otherUserProfile.id },
                { profile1Id: otherUserProfile.id, profile2Id: currentUserProfile.id }
              ]
            }
          },
          include: {
            match: true
          }
        });

        if (!chat) {
          // Create a new match and chat
          const match = await prisma.match.create({
            data: {
              profile1Id: currentUserProfile.id,
              profile2Id: otherUserProfile.id,
              score: 0, // Will be calculated later
              distance: 0, // Will be calculated later
              isMatched: true
            }
          });

          chat = await prisma.chat.create({
            data: {
              matchId: match.id
            },
            include: {
              match: true
            }
          });
        }

        const roomId = `chat:${chat.id}`;
        socket.join(roomId);
        socket.emit('joined_chat', { chatId: chat.id, roomId });
        
        // Send chat history
        const messages = await prisma.message.findMany({
          where: { chatId: chat.id },
          include: { sender: true },
          orderBy: { createdAt: 'asc' }
        });

        socket.emit('chat_history', messages.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          timestamp: msg.createdAt,
          read: msg.isRead
        })));

      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content } = data;
        const senderId = socket.data.userId;

        // Create message in database
        const message = await prisma.message.create({
          data: {
            chatId,
            senderId,
            content
          },
          include: {
            sender: true
          }
        });

        // Emit message to all users in the chat room
        const roomId = `chat:${chatId}`;
        io.to(roomId).emit('new_message', {
          id: message.id,
          senderId: message.senderId,
          content: message.content,
          timestamp: message.createdAt,
          read: message.isRead
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;
        await prisma.message.update({
          where: { id: messageId },
          data: { isRead: true }
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.data.userId} disconnected`);
    });
  });
}
