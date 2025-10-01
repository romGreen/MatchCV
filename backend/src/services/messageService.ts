import { prisma } from '../lib/prisma';
import { ApiResponse } from '../types/common';

export class MessageService {
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<ApiResponse<any>> {
    try {
      // Get sender profile by userId
      const senderProfile = await prisma.profile.findUnique({
        where: { userId: senderId }
      });
      
      // Get receiver profile by profileId (since we're passing profileId from frontend)
      const receiverProfile = await prisma.profile.findUnique({
        where: { id: receiverId }
      });

      if (!senderProfile || !receiverProfile) {
        return { success: false, error: 'User profiles not found' };
      }

      // Check if a match already exists between these profiles
      let match = await prisma.match.findFirst({
        where: {
          OR: [
            { profile1Id: senderProfile.id, profile2Id: receiverProfile.id },
            { profile1Id: receiverProfile.id, profile2Id: senderProfile.id }
          ]
        }
      });

      // If no match exists, create one
      if (!match) {
        match = await prisma.match.create({
          data: {
            profile1Id: senderProfile.id,
            profile2Id: receiverProfile.id,
            score: 0,
            distance: 0,
            isMatched: true
          }
        });
      }

      // Check if a chat already exists for this match
      let chat = await prisma.chat.findFirst({
        where: { matchId: match.id }
      });

      // If no chat exists, create one
      if (!chat) {
        chat = await prisma.chat.create({
          data: { matchId: match.id }
        });
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: senderProfile.id,
          content,
          isRead: false
        }
      });

      return { success: true, data: { message, chatId: chat.id } };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  async sendChatMessage(chatId: string, senderId: string, content: string): Promise<ApiResponse<any>> {
    try {
      // Get sender profile
      const senderProfile = await prisma.profile.findUnique({
        where: { userId: senderId }
      });

      if (!senderProfile) {
        return { success: false, error: 'Sender profile not found' };
      }

      // Verify user has access to this chat
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          match: {
            OR: [
              { profile1Id: senderProfile.id },
              { profile2Id: senderProfile.id }
            ]
          }
        }
      });

      if (!chat) {
        return { success: false, error: 'Chat not found or access denied' };
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          chatId: chatId,
          senderId: senderProfile.id,
          content,
          isRead: false
        }
      });

      return { success: true, data: { message, chatId: chatId } };
    } catch (error) {
      console.error('Error sending chat message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  async getUserMessages(userId: string): Promise<ApiResponse<any[]>> {
    try {
      // Get user's profile first
      const userProfile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!userProfile) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      // Get all chats for the user through matches
      const chats = await prisma.chat.findMany({
        where: {
          match: {
            OR: [
              { profile1Id: userProfile.id },
              { profile2Id: userProfile.id }
            ]
          }
        },
        include: {
          match: {
            include: {
              profile1: {
                include: {
                  photos: {
                    orderBy: { order: 'asc' }
                  }
                }
              },
              profile2: {
                include: {
                  photos: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      // Format the response
      const formattedChats = await Promise.all(chats.map(async chat => {
        const otherProfile = chat.match.profile1Id === userProfile.id 
          ? chat.match.profile2 
          : chat.match.profile1;
        const lastMessage = chat.messages[0];

        // Check if the last message is from the other user and is unread
        const hasUnread = lastMessage && 
          lastMessage.senderId === otherProfile.id && 
          !lastMessage.isRead;
        

        return {
          id: chat.id,
          otherUser: {
            id: otherProfile.id,
            displayName: otherProfile.displayName,
            avatarUrl: otherProfile.photos?.[0]?.photoUrl
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            isRead: lastMessage.isRead,
            isFromMe: lastMessage.senderId === userProfile.id
          } : null,
          hasUnread: !!hasUnread
        };
      }));

      return { success: true, data: formattedChats };
    } catch (error) {
      console.error('Error fetching user messages:', error);
      return { success: false, error: 'Failed to fetch messages' };
    }
  }

  async getChatMessages(chatId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      // Get user's profile
      const userProfile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      // Verify user has access to this chat
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          match: {
            OR: [
              { profile1Id: userProfile.id },
              { profile2Id: userProfile.id }
            ]
          }
        },
        include: {
          match: {
            include: {
              profile1: {
                include: {
                  photos: {
                    orderBy: { order: 'asc' }
                  }
                }
              },
              profile2: {
                include: {
                  photos: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          }
        }
      });

      if (!chat) {
        return { success: false, error: 'Chat not found or access denied' };
      }

      // Get all messages for this chat
      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: true
        }
      });

      // Format messages
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.createdAt,
        senderId: msg.senderId,
        isRead: msg.isRead,
        isFromMe: msg.senderId === userProfile.id
      }));

      const otherProfile = chat.match.profile1Id === userProfile.id 
        ? chat.match.profile2 
        : chat.match.profile1;

      return {
        success: true,
        data: {
          chatId: chat.id,
          otherUser: {
            id: otherProfile.id,
            displayName: otherProfile.displayName,
            avatarUrl: otherProfile.photos?.[0]?.photoUrl
          },
          messages: formattedMessages
        }
      };
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return { success: false, error: 'Failed to fetch chat messages' };
    }
  }

  async markChatAsRead(chatId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      // Get user's profile first
      const userProfile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!userProfile) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      // Get the chat to find the other user
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          match: {
            include: {
              profile1: true,
              profile2: true
            }
          }
        }
      });

      if (!chat) {
        return {
          success: false,
          error: 'Chat not found'
        };
      }

      // Find the other user's profile
      const otherProfile = chat.match.profile1Id === userProfile.id 
        ? chat.match.profile2 
        : chat.match.profile1;

      // Mark all unread messages from the other user as read
      const result = await prisma.message.updateMany({
        where: {
          chatId,
          senderId: otherProfile.id, // Only messages from the other user
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return { success: true, data: { message: 'Chat marked as read', count: result.count } };
    } catch (error) {
      console.error('Error marking chat as read:', error);
      return { success: false, error: 'Failed to mark chat as read' };
    }
  }
}