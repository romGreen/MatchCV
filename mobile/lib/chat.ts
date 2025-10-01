import { io, Socket } from 'socket.io-client';
import { authService } from './auth';
import { Message, ChatRoom } from '@matchcv/shared';

const SOCKET_URL = 'http://192.168.7.20:3001';

class ChatService {
  private static instance: ChatService;
  private socket: Socket | null = null;
  private isConnected = false;
  private messageListeners: ((message: Message) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Connect to the chat server
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.socket?.connected) return;

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Attempting to connect to chat server...');
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000, // 10 second timeout
        forceNew: true // Force new connection
      });

      // Set up event listeners
      this.socket.on('connect', () => {
        console.log('Connected to chat server');
        this.isConnected = true;
        this.connectionListeners.forEach(listener => listener(true));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from chat server:', reason);
        this.isConnected = false;
        this.connectionListeners.forEach(listener => listener(false));
      });

      this.socket.on('connect_error', (error) => {
        console.error('Chat server connection error:', error);
        this.isConnected = false;
        this.connectionListeners.forEach(listener => listener(false));
      });

      this.socket.on('new_message', (message: Message) => {
        console.log('New message received:', message);
        this.messageListeners.forEach(listener => listener(message));
      });

      this.socket.on('error', (error) => {
        console.error('Chat error:', error);
      });

    } catch (error) {
      console.error('Failed to connect to chat server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the chat server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Join a chat room with another user
   */
  async joinChat(otherUserId: string): Promise<string> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to chat server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join_chat', { otherUserId });
      
      this.socket!.once('joined_chat', (data) => {
        resolve(data.chatId);
      });

      this.socket!.once('error', (error) => {
        reject(new Error(error.message || 'Failed to join chat'));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Timeout joining chat'));
      }, 10000);
    });
  }

  /**
   * Send a message
   */
  sendMessage(chatId: string, content: string): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('send_message', { chatId, content });
  }

  /**
   * Mark a message as read
   */
  markAsRead(messageId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('mark_read', { messageId });
  }

  /**
   * Listen for new messages
   */
  onMessage(callback: (message: Message) => void): () => void {
    this.messageListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  /**
   * Listen for connection status changes
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get connection status
   */
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Wait for connection to be established
   */
  async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (this.isConnectedToServer()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
        resolve(false);
      }, timeout);

      const listener = (connected: boolean) => {
        if (connected) {
          clearTimeout(timeoutId);
          this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
          resolve(true);
        }
      };

      this.connectionListeners.push(listener);
    });
  }
}

export const chatService = ChatService.getInstance();
